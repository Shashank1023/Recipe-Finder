document.addEventListener('DOMContentLoaded', () => {
    const API_KEY = '821252d68ac74199aee1cb3ee046c959'; // Replace with your API key
    const BASE_URL = 'https://api.spoonacular.com/recipes';
    let ingredients = [];

    class RecipeAPI {
        constructor(apiKey) {
            this.apiKey = apiKey;
        }

        async findByIngredients(ingredients, options = {}) {
            try {
                const queryParams = new URLSearchParams({
                    apiKey: this.apiKey,
                    ingredients: ingredients.join(','),
                    number: options.number || 10,
                    ranking: 2,
                    ignorePantry: true
                });

                const response = await fetch(`${BASE_URL}/findByIngredients?${queryParams}`);
                if (!response.ok) throw new Error('Failed to fetch recipes');
                return await response.json();
            } catch (error) {
                console.error('Error finding recipes by ingredients:', error);
                throw error;
            }
        }

        async getRecipeInformation(recipeId) {
            try {
                const queryParams = new URLSearchParams({
                    apiKey: this.apiKey
                });

                const response = await fetch(`${BASE_URL}/${recipeId}/information?${queryParams}`);
                if (!response.ok) throw new Error('Failed to get recipe information');
                return await response.json();
            } catch (error) {
                console.error('Error getting recipe information:', error);
                throw error;
            }
        }

        async searchRecipes(params = {}) {
            try {
                const queryParams = new URLSearchParams({
                    apiKey: this.apiKey,
                    query: params.ingredients?.join(',') || '',
                    cuisine: params.cuisine || '',
                    diet: params.diet || '',
                    maxReadyTime: params.maxReadyTime || '',
                    number: params.number || 10,
                    instructionsRequired: true,
                    fillIngredients: true
                });

                const response = await fetch(`${BASE_URL}/complexSearch?${queryParams}`);
                if (!response.ok) throw new Error('Failed to search recipes');
                return await response.json();
            } catch (error) {
                console.error('Error searching recipes:', error);
                throw error;
            }
        }
    }

    const recipeAPI = new RecipeAPI(API_KEY);

    // Add ingredient to the list
    function addIngredient() {
        const input = document.getElementById('ingre');
        const ingredient = input.value.trim();

        if (ingredient && !ingredients.includes(ingredient)) {
            ingredients.push(ingredient);
            updateIngredientsDisplay();
            input.value = '';
        }
    }

    // Remove ingredient from the list
    function removeIngredient(ingredient) {
        ingredients = ingredients.filter(item => item !== ingredient);
        updateIngredientsDisplay();
    }

    // Update the displayed list of ingredients
    function updateIngredientsDisplay() {
        const list = document.getElementById('ingredients-list');
        if (!list) return;

        list.innerHTML = ingredients.map(ingredient => `
            <div class="ingredient-tag">
                ${ingredient}
                <button class="remove-ingredient" onclick="removeIngredient('${ingredient}')">&times;</button>
            </div>
        `).join('');
    }

    // Search for recipes
    async function searchRecipes() {
        if (ingredients.length === 0) {
            showError('Please add at least one ingredient');
            return;
        }

        showLoading(true);
        showError('');

        try {
            const servingsValue = document.getElementById('servings').value;
            const params = {
                ingredients: ingredients,
                cuisine: document.getElementById('CUISINES').value,
                diet: document.getElementById('DIET').value,
                maxReadyTime: document.getElementById('Duration').value,
                number: 10
            };

            const data = await recipeAPI.searchRecipes(params);
            displayRecipes(data.results, servingsValue);
        } catch (error) {
            showError('Error fetching recipes. Please try again.');
        } finally {
            showLoading(false);
        }
    }

    // Display recipes in the grid
    function displayRecipes(recipes, servings) {
        const grid = document.getElementById('recipes-grid');
        if (!grid) return;

        grid.innerHTML = '';

        if (!recipes || recipes.length === 0) {
            showError('No recipes found with these ingredients');
            return;
        }

        recipes.forEach(recipe => {
            const card = document.createElement('div');
            card.className = 'recipe-card';
            card.innerHTML = `
                <img src="${recipe.image}" alt="${recipe.title}" class="recipe-image">
                <div class="recipe-content">
                    <h3>${recipe.title}</h3>
                    <div class="recipe-stats">
                        <span>🕒 ${recipe.readyInMinutes || 'N/A'} mins</span>
                        <span>👥 ${servings || recipe.servings || 'N/A'} servings</span>
                    </div>
                </div>
            `;

            card.addEventListener('click', () => showRecipeDetails(recipe.id, servings));
            grid.appendChild(card);
        });
    }

    // Show recipe details in a modal
    async function showRecipeDetails(recipeId, servings) {
        try {
            showLoading(true);
            const recipe = await recipeAPI.getRecipeInformation(recipeId);

            const modalContent = document.getElementById('modal-content');
            if (!modalContent) return;

            modalContent.innerHTML = `
                <h2>${recipe.title}</h2>
                <img src="${recipe.image}" alt="${recipe.title}" style="max-width: 100%; border-radius: 10px; margin: 1rem 0;">
                
                <div class="ingredients-section">
                    <h3>Ingredients:</h3>
                    <ul>
                        ${recipe.extendedIngredients.map(ing => `
                            <li>${ing.original}</li>
                        `).join('')}
                    </ul>
                </div>

                <div class="instructions-section">
                    <h3>Instructions:</h3>
                    <ol class="instructions-list">
                        ${recipe.analyzedInstructions[0]?.steps.map(step => `
                            <li>${step.step}</li>
                        `).join('') || 'No instructions available.'}
                    </ol>
                </div>

                <div class="recipe-stats">
                    <p>Ready in: ${recipe.readyInMinutes} minutes</p>
                    <p>Servings: ${servings || recipe.servings}</p>
                </div>
            `;

            document.getElementById('recipe-modal').style.display = 'block';
        } catch (error) {
            showError('Error loading recipe details. Please try again.');
        } finally {
            showLoading(false);
        }
    }

    // Close the modal
    function closeModal() {
        document.getElementById('recipe-modal').style.display = 'none';
    }

    // Show loading state
    function showLoading(show) {
        const loading = document.getElementById('loading');
        if (loading) loading.style.display = show ? 'block' : 'none';
    }

    // Show error message
    function showError(message) {
        const error = document.getElementById('error');
        if (error) {
            error.textContent = message;
            error.style.display = message ? 'block' : 'none';
        }
    }

    // Event Listeners
    document.getElementById('addbtn').addEventListener('click', addIngredient);
    document.getElementById('submitbtn').addEventListener('click', searchRecipes);
    document.querySelector('.close-modal').addEventListener('click', closeModal);

    // Add keyboard support for ingredient input
    document.getElementById('ingre').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addIngredient();
        }
    });

    // Make removeIngredient function available globally
    window.removeIngredient = removeIngredient;

    // Close modal when clicking outside
    window.onclick = function (event) {
        const modal = document.getElementById('recipe-modal');
        if (event.target === modal) {
            closeModal();
        }
    };
});