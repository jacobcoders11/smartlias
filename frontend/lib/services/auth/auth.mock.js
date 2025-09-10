// =============================================================================
// AUTHENTICATION MOCK SERVICE - Demo Data for Development
// =============================================================================

import usersData from '../../../data/users.json'

/**
 * Mock Authentication Service for development and testing
 * Uses JSON data instead of real backend API calls
 */
class AuthMock {
  
  // Mock configuration
  static config = {
    NETWORK_DELAY: 100, // Simulate network latency
    TOKEN_EXPIRY: 24 * 60 * 60 * 1000 // 24 hours
  }

  // ==========================================================================
  // DATA ACCESS METHODS
  // ==========================================================================
  
  /**
   * Get users from JSON data
   */
  static getUsers() {
    return usersData.users
  }

  /**
   * Find user by username
   */
  static findUser(username) {
    return this.getUsers().find(user => 
      user.username.toLowerCase() === username.toLowerCase()
    )
  }

  // ==========================================================================
  // VALIDATION UTILITIES
  // ==========================================================================

  /**
   * Validate MPIN against demo user data
   */
  static validateMPIN(user, mpin) {
    // Demo MPIN mappings for testing
    const demoMPINs = {
      'juan.delacruz': '031590',
      'maria.santos': '120885', 
      'admin.staff': '010180',
      'jose.garcia': '067520',
      'ana.reyes': '091285'
    }
    
    return demoMPINs[user.username] === mpin
  }

  /**
   * Generate mock JWT token
   */
  static generateToken(user) {
    const payload = {
      id: user.id,
      username: user.username,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role_type,
      exp: Date.now() + this.config.TOKEN_EXPIRY
    }
    return btoa(JSON.stringify(payload))
  }

  // ==========================================================================
  // MOCK NETWORK SIMULATION
  // ==========================================================================

  /**
   * Simulate network delay for realistic testing
   */
  static async simulateNetwork() {
    await new Promise(resolve => 
      setTimeout(resolve, this.config.NETWORK_DELAY)
    )
  }

  // ==========================================================================
  // AUTHENTICATION METHODS
  // ==========================================================================

  /**
   * Mock login - validates against JSON data
   */
  static async login(username, password) {
    await this.simulateNetwork()

    // Input validation
    if (!username?.trim() || !password?.trim()) {
      return {
        success: false,
        error: 'Username and MPIN are required'
      }
    }

    // Find user
    const user = this.findUser(username.trim())
    if (!user) {
      return {
        success: false,
        error: 'Invalid credentials'
      }
    }

    // Validate MPIN
    if (!this.validateMPIN(user, password)) {
      return {
        success: false,
        error: 'Invalid credentials'
      }
    }

    // Generate mock token
    const token = this.generateToken(user)

    // Store session
    const sessionData = {
      token,
      user: {
        id: user.id,
        username: user.username,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role_type
      }
    }
    localStorage.setItem('smartlias_user_session', JSON.stringify(sessionData))

    return {
      success: true,
      user: sessionData.user,
      redirectTo: user.role_type === 2 ? '/admin' : '/resident'
    }
  }

  /**
   * Mock username check
   */
  static async checkUsername(username) {
    await this.simulateNetwork()

    if (!username?.trim()) {
      return {
        success: false,
        error: 'Username is required'
      }
    }

    // Validate format
    const sanitized = username.trim()
    if (!/^[a-zA-Z0-9._-]+$/.test(sanitized)) {
      return {
        success: false,
        error: 'Username contains invalid characters.'
      }
    }

    if (sanitized.length > 64) {
      return {
        success: false,
        error: 'Username must not exceed maximum length.'
      }
    }

    // Check if user exists
    const user = this.findUser(sanitized)
    if (!user) {
      return {
        success: false,
        error: 'Username does not exist. Please visit the Barangay office to register.'
      }
    }

    return {
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role_type
        }
      }
    }
  }

  /**
   * Mock logout
   */
  static async logout() {
    await this.simulateNetwork()
    
    // Clear session
    localStorage.removeItem('smartlias_user_session')
    
    return { success: true }
  }

  /**
   * Mock get session
   */
  static async getSession() {
    await this.simulateNetwork()
    
    const session = JSON.parse(localStorage.getItem('smartlias_user_session') || 'null')
    
    if (!session) {
      return { success: false, error: 'No active session' }
    }

    return {
      success: true,
      user: session.user
    }
  }
}

export default AuthMock
