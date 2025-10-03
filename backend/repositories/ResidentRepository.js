/**
 * Resident Repository
 * Handles all resident data access (database or JSON files)
 */

const fs = require('fs').promises
const path = require('path')
const config = require('../config/config')
const db = require('../config/db')
const logger = require('../config/logger')
const IDUtils = require('../utils/idUtils')

class ResidentRepository {
  /**
   * Calculate age from birth_date
   * @param {Date|string} birthDate - Birth date
   * @returns {number|null} - Age in years or null if invalid
   */
  static calculateAge(birthDate) {
    if (!birthDate) return null
    
    const today = new Date()
    const birth = new Date(birthDate)
    
    if (isNaN(birth.getTime())) return null
    
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    
    return age >= 0 ? age : null
  }

  /**
   * Add calculated age and formatted ID to resident object
   * @param {Object} resident - Resident object
   * @returns {Object} - Resident with age field and formatted ID
   */
  static enrichWithAge(resident) {
    if (!resident) return resident
    
    return {
      ...resident,
      id: IDUtils.formatID(resident.id), // Always format ID with leading zeros
      age: this.calculateAge(resident.birth_date)
    }
  }

  /**
   * Get all residents with optional search and pagination
   */
  static async findAll(searchQuery = '', page = 1, limit = 50) {
    if (config.USE_MOCK_DATA) {
      return await this._findAllJSON(searchQuery, page, limit)
    } else {
      return await this._findAllDB(searchQuery, page, limit)
    }
  }

  /**
   * Get resident by ID
   */
  static async findById(id) {
    if (config.USE_MOCK_DATA) {
      return await this._findByIdJSON(id)
    } else {
      return await this._findByIdDB(id)
    }
  }

  /**
   * Create new resident
   */
  static async create(residentData) {
    if (config.USE_MOCK_DATA) {
      return await this._createJSON(residentData)
    } else {
      return await this._createDB(residentData)
    }
  }

  /**
   * Update resident
   */
  static async update(id, residentData) {
    if (config.USE_MOCK_DATA) {
      return await this._updateJSON(id, residentData)
    } else {
      return await this._updateDB(id, residentData)
    }
  }

  /**
   * Delete resident
   */
  static async delete(id) {
    if (config.USE_MOCK_DATA) {
      return await this._deleteJSON(id)
    } else {
      return await this._deleteDB(id)
    }
  }

  /**
   * Get resident statistics
   */
  static async getStats() {
    if (config.USE_MOCK_DATA) {
      return await this._getStatsJSON()
    } else {
      return await this._getStatsDB()
    }
  }

  // ==========================================================================
  // DATABASE METHODS
  // ==========================================================================

  static async _findAllDB(searchQuery, page, limit) {
    const offset = (page - 1) * limit
    let query = `
      SELECT * FROM residents 
      WHERE is_active = 1
    `
    const params = []

    if (searchQuery) {
      query += ` AND (
        LOWER(first_name) LIKE LOWER($1) OR 
        LOWER(last_name) LIKE LOWER($1) OR
        LOWER(address) LIKE LOWER($1)
      )`
      params.push(`%${searchQuery}%`)
    }

    query += ` ORDER BY last_name, first_name LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
    params.push(limit, offset)

    const result = await db.query(query, params)
    const countResult = await db.query('SELECT COUNT(*) as total FROM residents WHERE is_active = 1')
    
    // Add calculated age to each resident
    const residentsWithAge = result.rows.map(resident => this.enrichWithAge(resident))
    
    return {
      residents: residentsWithAge,
      total: parseInt(countResult.rows[0].total),
      page,
      limit
    }
  }

  static async _findByIdDB(id) {
    // First get the resident
    const residentQuery = `SELECT * FROM residents WHERE id = $1`
    const residentResult = await db.query(residentQuery, [id])
    
    if (residentResult.rows.length === 0) {
      return null
    }
    
    const resident = residentResult.rows[0]
    
    // If resident has a user_id, fetch user credentials for lazy loading
    if (resident.user_id) {
      try {
        const userQuery = `SELECT username, is_password_changed, created_at FROM users WHERE id = $1`
        const userResult = await db.query(userQuery, [resident.user_id])
        
        if (userResult.rows.length > 0) {
          const user = userResult.rows[0]
          // Add user info to resident
          resident.username = user.username
          resident.is_password_changed = user.is_password_changed
          resident.user_created_at = user.created_at
          
          // For users who haven't changed password, we'll need the actual password
          // Let's check if they have a stored plain password or if we need to generate one
          if (user.is_password_changed === 0) {
            // For demo purposes, we'll show the username as the temp password
            // In production, you'd want to have a separate temp_password field or generate one
            resident.temp_password = user.username.split('.').pop() // Extract the last part as demo PIN
          }
        }
      } catch (error) {
        console.error('Error fetching user data for resident:', error)
        // Continue without user data if there's an error
      }
    }
    
    return this.enrichWithAge(resident)
  }

  static async _createDB(data) {
    // Transform data for database compatibility
    const dbData = this._transformForDB(data)
    
    const result = await db.query(`
      INSERT INTO residents (
        user_id, last_name, first_name, middle_name, birth_date, gender,
        civil_status, contact_number, email, address, purok,
        religion, occupation, is_active, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 1, CURRENT_TIMESTAMP)
      RETURNING *
    `, [
      dbData.userId, dbData.lastName, dbData.firstName, dbData.middleName, 
      dbData.birthDate, dbData.gender, dbData.civilStatus, dbData.contactNumber, 
      dbData.email, dbData.address, dbData.purok, dbData.religion, dbData.occupation
    ])
    return this.enrichWithAge(result.rows[0])
  }

  /**
   * Transform data for database compatibility
   * Converts string values to appropriate database types
   */
  static _transformForDB(data) {
    const transformed = { ...data }

    // Convert gender string to integer
    if (data.gender) {
      const genderStr = data.gender.toString().toLowerCase()
      if (genderStr === 'male' || genderStr === '1') {
        transformed.gender = 1
      } else if (genderStr === 'female' || genderStr === '2') {
        transformed.gender = 2
      } else {
        transformed.gender = parseInt(data.gender) || null
      }
    } else {
      transformed.gender = null
    }

    // Convert purok to integer
    if (data.purok) {
      transformed.purok = parseInt(data.purok) || null
    } else {
      transformed.purok = null
    }

    // Ensure userId is integer
    if (data.userId) {
      transformed.userId = parseInt(data.userId)
    }

    // Handle birth date
    if (data.birthDate && data.birthDate !== '') {
      transformed.birthDate = data.birthDate
    } else {
      transformed.birthDate = null
    }

    // Clean up empty strings to null for optional fields
    const optionalFields = ['middleName', 'email', 'homeNumber', 'mobileNumber', 
                           'religion', 'occupation', 'civilStatus']
    
    optionalFields.forEach(field => {
      if (transformed[field] === '' || transformed[field] === undefined) {
        transformed[field] = null
      }
    })

    return transformed
  }

  static async _updateDB(id, data) {
    // Transform data for database compatibility
    const dbData = this._transformForDB(data)
    
    const result = await db.query(`
      UPDATE residents SET
        last_name = $1, first_name = $2, middle_name = $3, birth_date = $4,
        gender = $5, civil_status = $6, contact_number = $7, email = $8,
        address = $9, purok = $10, religion = $11, occupation = $12,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $13
      RETURNING *
    `, [
      dbData.lastName, dbData.firstName, dbData.middleName, dbData.birthDate,
      dbData.gender, dbData.civilStatus, dbData.contactNumber, dbData.email,
      dbData.address, dbData.purok, dbData.religion, dbData.occupation, id
    ])
    return this.enrichWithAge(result.rows[0])
  }

  static async _deleteDB(id) {
    await db.query('UPDATE residents SET is_active = 0 WHERE id = $1', [id])
    return true
  }

  static async _getStatsDB() {
    const totalResult = await db.query('SELECT COUNT(*) as count FROM residents WHERE is_active = 1')
    const recentResult = await db.query(`
      SELECT COUNT(*) as count FROM residents 
      WHERE is_active = 1 AND created_at >= NOW() - INTERVAL '30 days'
    `)
    
    return {
      total: parseInt(totalResult.rows[0].count),
      recentCount: parseInt(recentResult.rows[0].count)
    }
  }

  // ==========================================================================
  // JSON FILE METHODS
  // ==========================================================================

  static async _findAllJSON(searchQuery, page, limit) {
    const residents = await this._loadResidentsJSON()
    let filtered = residents.filter(r => r.is_active !== 0)

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(r => 
        r.first_name?.toLowerCase().includes(query) ||
        r.last_name?.toLowerCase().includes(query) ||
        r.address?.toLowerCase().includes(query)
      )
    }

    const offset = (page - 1) * limit
    const paginated = filtered.slice(offset, offset + limit)

    // Add calculated age to each resident
    const residentsWithAge = paginated.map(resident => this.enrichWithAge(resident))

    return {
      residents: residentsWithAge,
      total: filtered.length,
      page,
      limit
    }
  }

  static async _findByIdJSON(id) {
    const residents = await this._loadResidentsJSON()
    const resident = residents.find(r => r.id === parseInt(id))
    return this.enrichWithAge(resident)
  }

  static async _createJSON(data) {
    const residents = await this._loadResidentsJSON()
    const newId = Math.max(...residents.map(r => r.id), 0) + 1
    
    const newResident = {
      id: newId,
      ...data,
      is_active: 1,
      created_at: new Date().toISOString()
    }
    
    residents.push(newResident)
    await this._saveResidentsJSON(residents)
    return this.enrichWithAge(newResident)
  }

  static async _updateJSON(id, data) {
    const residents = await this._loadResidentsJSON()
    const index = residents.findIndex(r => r.id === parseInt(id))
    
    if (index === -1) return null
    
    residents[index] = {
      ...residents[index],
      ...data,
      updated_at: new Date().toISOString()
    }
    
    await this._saveResidentsJSON(residents)
    return this.enrichWithAge(residents[index])
  }

  static async _deleteJSON(id) {
    const residents = await this._loadResidentsJSON()
    const resident = residents.find(r => r.id === parseInt(id))
    
    if (resident) {
      resident.is_active = 0
      await this._saveResidentsJSON(residents)
    }
    return true
  }

  static async _getStatsJSON() {
    const residents = await this._loadResidentsJSON()
    const active = residents.filter(r => r.is_active !== 0)
    
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const recent = active.filter(r => {
      const created = new Date(r.created_at || r.createdAt)
      return created > thirtyDaysAgo
    })

    return {
      total: active.length,
      recentCount: recent.length
    }
  }

  static async _loadResidentsJSON() {
    try {
      const filePath = path.join(__dirname, '../data/residents.json')
      const data = await fs.readFile(filePath, 'utf8')
      const parsed = JSON.parse(data)
      // Skip the first element if it's metadata
      return Array.isArray(parsed) && parsed[0]?._comment ? parsed.slice(1) : parsed
    } catch (error) {
      logger.error('Failed to load residents.json', error)
      return []
    }
  }

  static async _saveResidentsJSON(residents) {
    try {
      const filePath = path.join(__dirname, '../data/residents.json')
      await fs.writeFile(filePath, JSON.stringify(residents, null, 2), 'utf8')
      return true
    } catch (error) {
      logger.error('Failed to save residents.json', error)
      return false
    }
  }
}

module.exports = ResidentRepository
