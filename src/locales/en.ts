export default {
  translation: {
    // Common
    common: {
      save: 'Save',
      cancel: 'Cancel',
      close: 'Close',
      error: 'Error',
      success: 'Success',
      ok: 'OK',
      delete: 'Delete',
      edit: 'Edit',
      add: 'Add',
    },

    // Goal types
    goalTypes: {
      lose_weight: 'Lose Weight',
      maintain: 'Maintain Weight',
      gain_weight: 'Gain Muscle',
    },

    // Activity levels
    activityLevels: {
      sedentary: 'Sedentary Lifestyle',
      light: 'Light Activity (1-3 times/week)',
      moderate: 'Moderate Activity (3-5 times/week)',
      active: 'High Activity (6-7 times/week)',
      very_active: 'Very High Activity (2+ times/day)',
    },

    // Auth
    auth: {
      welcome: 'Welcome',
      signIn: 'Sign In',
      signUp: 'Sign Up',
      email: 'Email',
      password: 'Password',
      signInButton: 'Sign In',
      signUpButton: 'Sign Up',
      alreadyHaveAccount: 'Already have an account?',
      dontHaveAccount: "Don't have an account?",
      invalidEmail: 'Invalid email format',
      passwordTooShort: 'Password must be at least 6 characters',
      signInError: 'Sign in error',
      signUpError: 'Sign up error',
    },

    // Chat
    chat: {
      title: 'AI Dietitian',
      placeholder: 'Ask about nutrition...',
      limitReached: 'Limit reached',
      requestsUsed: '{{used}}/{{limit}} requests',
      noInternet: 'No internet connection',
      tryAgain: 'Try again',
      aiTyping: 'AI is typing...',
    },

    // Diary
    diary: {
      title: 'Food Diary',
      today: 'Today',
      calories: 'Calories',
      protein: 'Protein',
      carbs: 'Carbs',
      fat: 'Fat',
      goal: 'Goal',
      addMeal: 'Add Meal',
      emptyState: 'No entries for today',
      emptyStateHint: 'Add your first meal',
      mealTypes: {
        breakfast: 'Breakfast',
        lunch: 'Lunch',
        dinner: 'Dinner',
        snack: 'Snack',
      },
      addMealModal: {
        title: 'Add Meal',
        mealType: 'Meal Type',
        mealName: 'Meal Name',
        enterMealName: 'Enter name',
        caloriesLabel: 'Calories (kcal)',
        proteinLabel: 'Protein (g)',
        carbsLabel: 'Carbs (g)',
        fatLabel: 'Fat (g)',
        photoButton: '📸 Take Photo of Food',
        analyzing: 'Analyzing photo...',
        photoError: 'Could not recognize photo',
        invalidValues: 'Please enter valid values',
        deleteMeal: 'Delete Entry',
        deleteConfirm: 'Delete this entry?',
      },
    },

    // Onboarding
    onboarding: {
      welcome: 'Welcome!',
      title: 'Your Personal AI Dietitian',
      subtitle: 'Helping you achieve your nutrition goals',
      skip: 'Skip',
      next: 'Next',
      getStarted: 'Get Started',
      features: {
        aiChat: 'AI nutrition consultations',
        photoRecognition: '📸 Food recognition by photo',
        tracking: 'Track calories and macros',
        goals: 'Personal goals',
      },
    },

    // Profile
    profile: {
      title: 'Profile',
      user: 'User',
      editHint: 'Tap to edit',

      subscription: {
        free: 'FREE',
        premium: '⭐ PREMIUM',
        premiumUntil: 'Active until {{date}}',
        upgradeToPremium: 'Upgrade to Premium for unlimited access',
        upgradeButton: 'Upgrade to Premium ⭐',
      },

      sections: {
        goalSettings: 'Goal Settings',
        appSettings: 'Application',
      },

      goalSettings: {
        targetWeight: 'Target Weight',
        targetWeightValue: '{{weight}} kg',
        notSet: 'Not set',
        dailyCalories: 'Daily Calorie Goal',
        dailyCaloriesValue: '{{calories}} kcal',
        goal: 'Goal',
        goalNotSet: 'Not set',
      },

      appSettings: {
        notifications: 'Notifications',
        theme: 'App Theme',
        language: 'Language',
        about: 'About',
      },

      theme: {
        selectTheme: 'Select Theme',
        light: 'Light',
        dark: 'Dark',
        auto: 'Auto (System)',
      },

      language: {
        selectLanguage: 'Select Language',
        russian: 'Русский',
        english: 'English',
      },

      actions: {
        logout: 'Log Out',
        logoutTitle: 'Log Out',
        logoutMessage: 'Are you sure you want to log out?',
        cancel: 'Cancel',
        confirm: 'Log Out',
      },

      alerts: {
        success: 'Success',
        profileUpdated: 'Profile updated',
        error: 'Error',
        updateFailed: 'Failed to update profile',
      },

      editModals: {
        editName: 'Edit Name',
        enterName: 'Enter name',
        pleaseEnterName: 'Please enter a name',

        editTargetWeight: 'Target Weight',
        enterTargetWeight: 'Enter target weight',
        invalidWeight: 'Please enter a valid weight (30-300 kg)',
        targetWeightLowerForLoss: 'Target weight must be lower than current weight for weight loss',
        targetWeightHigherForGain:
          'Target weight must be higher than current weight for muscle gain',
        currentWeight: 'Current weight: {{weight}} kg',
        yourGoal: 'Your goal: {{goal}}',

        editCalories: 'Daily Calorie Goal',
        enterCalories: 'Enter calorie goal',
        invalidCalories: 'Please enter a valid value (1200-5000 kcal)',
        recommended: 'Recommended: {{calories}} kcal',
        basedOnProfile: 'Based on your profile',

        selectGoal: 'Select Goal',
      },
    },

    // Paywall
    paywall: {
      title: 'Premium',
      subtitle: 'Unlock all features',
      unlimitedAI: 'Unlimited AI chat',
      weeklyPlans: 'Weekly meal plans',
      advancedAnalytics: 'Advanced analytics',
      recipeDatabase: '1000+ recipes database',
      prioritySupport: 'Priority support',
      yearlyPlan: '🏆 Yearly Subscription',
      monthlyPlan: 'Monthly Subscription',
      yearlyPrice: '$79.99/year',
      monthlyPrice: '$9.99/month',
      savings: 'Save $39.99',
      best: 'Best',
      purchaseButton: 'Purchase Premium',
      comingSoon: 'Coming Soon',
      comingSoonMessage: 'Stripe payments will be available in the next version',
      cancelAnytime: 'Cancel anytime in settings',
      restorePurchases: 'Restore Purchases',
      restoreMessage: 'Feature coming soon',
    },
  },
};
