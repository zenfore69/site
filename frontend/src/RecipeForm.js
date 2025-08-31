import React, { useState, useEffect } from 'react';
import { FaImage, FaPencilAlt } from 'react-icons/fa';
import './RecipeForm.css';
//wqss
function RecipeForm({ onSave, onClose, initialRecipe }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [ingredients, setIngredients] = useState([{ name: '', quantity: '' }]);
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [stepImages, setStepImages] = useState([]);
  const [stepImagePreviews, setStepImagePreviews] = useState([]);
  const [stepInstructions, setStepInstructions] = useState([]); // Новое состояние для инструкций
  const [calories, setCalories] = useState('');
  const [cookingTime, setCookingTime] = useState('');

  useEffect(() => {
    if (initialRecipe) {
      setName(initialRecipe.name || '');
      setDescription(initialRecipe.description || '');
      setIngredients(
        Array.isArray(initialRecipe.ingredients_list) && initialRecipe.ingredients_list.length > 0
          ? initialRecipe.ingredients_list.map(ing => {
              const match = ing.match(/^(\d+\s*\w*)\s*(.*)$/);
              return match ? { quantity: match[1], name: match[2] } : { quantity: '', name: ing };
            })
          : [{ name: '', quantity: '' }]
      );
      setCalories(initialRecipe.calories || '');
      setCookingTime(initialRecipe.cooking_time || '');
      if (initialRecipe.image) {
        setImagePreview(initialRecipe.image);
      }
      if (Array.isArray(initialRecipe.step_images)) {
        setStepImagePreviews(initialRecipe.step_images.slice(0, 10));
      }
      if (Array.isArray(initialRecipe.step_instructions)) {
        setStepInstructions(initialRecipe.step_instructions);
      } else if (initialRecipe.instructions) {
        setStepInstructions(initialRecipe.instructions.split('\n').filter(step => step.trim()));
      }
    }
  }, [initialRecipe]);

  const handleIngredientChange = (index, field, value) => {
    const newIngredients = [...ingredients];
    newIngredients[index][field] = value;
    setIngredients(newIngredients);
  };

  const addIngredient = () => {
    setIngredients([...ingredients, { name: '', quantity: '' }]);
  };

  const removeIngredient = (index) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter((_, i) => i !== index));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleStepImageChange = (e, index = null, instruction = '') => {
    const file = e.target.files[0];
    if (!file) return;

    if (!instruction.trim()) {
      alert('Пожалуйста, введите инструкцию для этого шага');
      return;
    }

    if (index !== null) {
      const newStepImages = [...stepImages];
      const newPreviews = [...stepImagePreviews];
      const newInstructions = [...stepInstructions];
      newStepImages[index] = file;
      newPreviews[index] = URL.createObjectURL(file);
      newInstructions[index] = instruction;
      setStepImages(newStepImages);
      setStepImagePreviews(newPreviews);
      setStepInstructions(newInstructions);
    } else if (stepImages.length < 10) {
      setStepImages([...stepImages, file]);
      setStepImagePreviews([...stepImagePreviews, URL.createObjectURL(file)]);
      setStepInstructions([...stepInstructions, instruction]);
    } else {
      alert('Максимум 10 пошаговых изображений!');
    }
  };

  const handleStepInstructionChange = (index, value) => {
    const newInstructions = [...stepInstructions];
    newInstructions[index] = value;
    setStepInstructions(newInstructions);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    if (image) {
      formData.append('image', image);
    }

    ingredients.forEach((ingredient, index) => {
      if (ingredient.name.trim()) {
        const ingredientString = ingredient.quantity
          ? `${ingredient.quantity} ${ingredient.name}`
          : ingredient.name;
        formData.append(`ingredient_${index}`, ingredientString);
      }
    });

    stepImages.forEach((stepImage, index) => {
      if (stepImage) {
        formData.append(`step_image_${index}`, stepImage);
      }
    });

    stepInstructions.forEach((instruction, index) => {
      if (instruction.trim()) {
        formData.append(`step_instruction_${index}`, instruction);
      }
    });

    if (cookingTime) {
      formData.append('cooking_time', parseInt(cookingTime, 10));
    }
    if (calories) {
      formData.append('calories', parseInt(calories, 10));
    }

    console.log('Отправляемые данные:', Object.fromEntries(formData));
    onSave(formData);
    onClose();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addIngredient();
    }
  };

  return (
    <div className="recipe-form-overlay">
      <form className="recipe-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Название рецепта</label>
          <input
            id="name"
            type="text"
            placeholder="Введите название рецепта"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="form-content">
          <div className="image-section">
            <div className="main-image-container">
              {imagePreview ? (
                <img src={imagePreview} alt="Main" className="main-image" />
              ) : (
                <div className="image-placeholder">
                  <FaImage size={50} />
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="image-input"
                id="main-image-input"
              />
              <label htmlFor="main-image-input" className="image-label">
                {imagePreview ? 'Заменить изображение' : 'Добавить изображение'}
              </label>
            </div>

            <div className="step-images-section">
              <div className="step-images-list">
                {stepImagePreviews.map((preview, index) => (
                  <div key={index} className="step-image-item">
                    <img src={preview} alt={`Step ${index + 1}`} className="step-image" />
                    <div className="edit-overlay">
                      <FaPencilAlt className="edit-icon" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleStepImageChange(e, index, stepInstructions[index] || '')}
                        className="image-input"
                        id={`step-image-input-${index}`}
                      />
                      <label htmlFor={`step-image-input-${index}`} className="edit-label" />
                    </div>
                    <textarea
                      placeholder={`Инструкция для шага ${index + 1}`}
                      value={stepInstructions[index] || ''}
                      onChange={(e) => handleStepInstructionChange(index, e.target.value)}
                      required
                      className="step-instruction-input"
                    />
                  </div>
                ))}
              </div>
              {stepImages.length < 10 && (
                <div className="add-step-image">
                  <FaImage size={30} />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const instruction = prompt('Введите инструкцию для этого шага:');
                      if (instruction) handleStepImageChange(e, null, instruction);
                    }}
                    className="image-input"
                    id="add-step-image"
                  />
                  <label htmlFor="add-step-image" className="add-image-label">
                    Добавить пошаговое изображение
                  </label>
                </div>
              )}
            </div>
          </div>

          <div className="details-section">
            <div className="form-group ingredients-group">
              <label>Ингредиенты</label>
              {ingredients.map((ingredient, index) => (
                <div key={index} className="ingredient-input">
                  <input
                    type="text"
                    placeholder="Название ингредиента"
                    value={ingredient.name}
                    onChange={(e) => handleIngredientChange(index, 'name', e.target.value)}
                    onKeyPress={handleKeyPress}
                    required
                    className="ingredient-name-input"
                  />
                  <input
                    type="text"
                    placeholder="Количество"
                    value={ingredient.quantity}
                    onChange={(e) => handleIngredientChange(index, 'quantity', e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="quantity-input"
                  />
                  <button
                    type="button"
                    onClick={() => removeIngredient(index)}
                    disabled={ingredients.length === 1}
                  >
                    Удалить
                  </button>
                </div>
              ))}
              <button type="button" onClick={addIngredient}>
                Добавить ингредиент
              </button>
            </div>

            <div className="form-group nutrition-group">
              <label>Питательная ценность</label>
              <div className="nutrition-input">
                <input
                  type="number"
                  placeholder="Калории"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                  required
                />
                <input
                  type="number"
                  placeholder="Время приготовления (мин)"
                  value={cookingTime}
                  onChange={(e) => setCookingTime(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="description">Описание</label>
          <textarea
            id="description"
            placeholder="Введите описание"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>

        <div className="form-buttons">
          <button type="submit" className="save-btn">Сохранить</button>
          <button type="button" className="cancel-btn" onClick={onClose}>Отмена</button>
        </div>
      </form>
    </div>
  );
}

export default RecipeForm;