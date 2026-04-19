export interface Goals {
  calories: number
  vegetables_g: number
  avocado_g: number
  calcium_mg: number
  omega3_g: number
  eggs: number
  seafood_portions: number
  steps_goal: number
}

export interface DailyLog {
  date: string
  weight_kg: number | null
  steps: number | null
}

export type FoodCategory =
  | 'vegetables'
  | 'avocado'
  | 'eggs'
  | 'seafood'
  | 'other'

export interface FoodCache {
  food_name: string
  category: FoodCategory
  omega3_per_100g: number | null
}

export interface FatsecretFood {
  food_id: string
  food_name: string
  serving_description: string
  metric_serving_amount: number
  metric_serving_unit: string
  calories: number
  protein: number
  fat: number
  carbohydrate: number
  calcium: number
}

export interface DailyNutrition {
  calories: number
  vegetables_g: number
  avocado_g: number
  calcium_mg: number
  omega3_g: number
  eggs: number
  seafood_portions: number
}
