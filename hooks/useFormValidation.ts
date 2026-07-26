'use client'

import { useState, useCallback } from 'react'

export interface ValidationRules {
  [field: string]: {
    required?: boolean
    minLength?: number
    maxLength?: number
    pattern?: RegExp
    custom?: (value: any) => string | null
    message?: string
  }
}

export interface FormErrors {
  [field: string]: string | null
}

export function useFormValidation(rules: ValidationRules) {
  const [errors, setErrors] = useState<FormErrors>({})
  const [validating, setValidating] = useState<string | null>(null)

  const validateField = useCallback(
    async (field: string, value: any): Promise<string | null> => {
      const rule = rules[field]

      if (!rule) return null

      // Check required
      if (rule.required && !value) {
        return rule.message || `${field} is required`
      }

      if (!value) return null

      // Check min length
      if (rule.minLength && value.length < rule.minLength) {
        return rule.message || `${field} must be at least ${rule.minLength} characters`
      }

      // Check max length
      if (rule.maxLength && value.length > rule.maxLength) {
        return rule.message || `${field} must not exceed ${rule.maxLength} characters`
      }

      // Check pattern
      if (rule.pattern && !rule.pattern.test(value)) {
        return rule.message || `${field} format is invalid`
      }

      // Check custom validation
      if (rule.custom) {
        return rule.custom(value)
      }

      return null
    },
    [rules]
  )

  const validate = useCallback(
    async (field: string, value: any) => {
      setValidating(field)
      try {
        const error = await validateField(field, value)
        setErrors((prev) => ({
          ...prev,
          [field]: error,
        }))
        return error === null
      } finally {
        setValidating(null)
      }
    },
    [validateField]
  )

  const validateAll = useCallback(
    async (values: Record<string, any>): Promise<boolean> => {
      const newErrors: FormErrors = {}

      for (const [field, value] of Object.entries(values)) {
        const error = await validateField(field, value)
        newErrors[field] = error
      }

      setErrors(newErrors)
      return Object.values(newErrors).every((error) => error === null)
    },
    [validateField]
  )

  const clearError = useCallback((field: string) => {
    setErrors((prev) => ({
      ...prev,
      [field]: null,
    }))
  }, [])

  const clearAllErrors = useCallback(() => {
    setErrors({})
  }, [])

  return {
    errors,
    validating,
    validate,
    validateAll,
    clearError,
    clearAllErrors,
  }
}
