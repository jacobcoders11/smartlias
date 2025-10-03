/**
 * Suffix name constants
 * Used for displaying and storing suffix values
 */
export const SUFFIX_OPTIONS = [
  { value: '', label: 'None' },
  { value: 1, label: 'Jr.' },
  { value: 2, label: 'Sr.' },
  { value: 3, label: 'II' },
  { value: 4, label: 'III' },
  { value: 5, label: 'IV' },
  { value: 6, label: 'V' }
]

/**
 * Get suffix label from numeric value
 * @param {number} value - Numeric suffix value
 * @returns {string} - Suffix label (e.g., 'Jr.', 'Sr.')
 */
export const getSuffixLabel = (value) => {
  const suffix = SUFFIX_OPTIONS.find(opt => opt.value === value)
  return suffix ? suffix.label : ''
}

/**
 * Get suffix value from label
 * @param {string} label - Suffix label
 * @returns {number} - Numeric suffix value
 */
export const getSuffixValue = (label) => {
  const suffix = SUFFIX_OPTIONS.find(opt => opt.label === label)
  return suffix ? suffix.value : ''
}
