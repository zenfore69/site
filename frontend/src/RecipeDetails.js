import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FaHeart, FaTimes, FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import './RecipeDetails.css';
import { BASE_URL } from './config';

function RecipeDetails({ recipes, user, onOpenLogin, onOpenRegister }) {
  const { id } = useParams();
  const [recipe, setRecipe] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalImage, setModalImage] = useState('');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        const response = await fetch(`${BASE_URL}/api/recipes/${id}/`);
        if (!response.ok) throw new Error('Ошибка загрузки рецепта');
        const data = await response.json();
        const updatedRecipe = {
          ...data,
          image: data.image
            ? data.image.startsWith('http')
              ? data.image
              : `${BASE_URL}${data.image}`
            : '/default-image.jpg',
          step_images: Array.isArray(data.step_images)
            ? data.step_images.slice(0, 10).map(img =>
                img && typeof img === 'string' && img.startsWith('http')
                  ? img
                  : `${BASE_URL}${img || '/default-image.jpg'}`
              )
            : [],
          step_instructions: Array.isArray(data.step_instructions)
            ? data.step_instructions
            : (data.instructions || '').split('\n').filter(step => step.trim()),
          attributes: Array.isArray(data.attributes) ? data.attributes : [],
          ingredients_list: Array.isArray(data.ingredients_list) ? data.ingredients_list : [],
        };
        console.log(data.instructions);
        setRecipe(updatedRecipe);
      } catch (error) {
        console.error('Ошибка загрузки рецепта:', error);
        setRecipe(null);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchComments = async () => {
      try {
        const response = await fetch(`${BASE_URL}/api/comments/?recipe=${id}`);
        if (!response.ok) throw new Error('Ошибка загрузки комментариев');
        const data = await response.json();
        setComments(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Ошибка загрузки комментариев:', error);
        setComments([]);
      }
    };

    fetchRecipe();
    fetchComments();
    if (user) {
      const checkFavoriteStatus = async () => {
        try {
          const response = await fetch(`${BASE_URL}/api/favorites/`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
          });
          if (!response.ok) throw new Error('Ошибка при проверке избранного');
          const favorites = await response.json();
          const isFav = favorites.some(fav => fav.recipe.id === Number(id));
          setIsFavorite(isFav);
        } catch (error) {
          console.error('Ошибка проверки избранного:', error);
        }
      };
      checkFavoriteStatus();
    }
  }, [id, user]);

  const toggleFavorite = async () => {
    if (!user) {
      onOpenLogin();
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      if (isFavorite) {
        const response = await fetch(`${BASE_URL}/api/favorites/${id}/`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!response.ok) throw new Error('Ошибка удаления из избранного');
        setIsFavorite(false);
      } else {
        const response = await fetch(`${BASE_URL}/api/favorites/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ recipe_id: id }),
        });
        if (!response.ok) throw new Error('Ошибка добавления в избранное');
        setIsFavorite(true);
      }
    } catch (error) {
      console.error('Ошибка переключения избранного:', error);
    }
  };

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (!newComment.trim()) {
      alert('Комментарий не может быть пустым');
      return;
    }
    fetch(`${BASE_URL}/api/comments/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
      },
      body: JSON.stringify({ recipe: id, text: newComment }),
    })
      .then(response => {
        if (!response.ok) throw new Error('Ошибка при отправке комментария');
        return response.json();
      })
      .then(data => {
        setComments([...comments, data]);
        setNewComment('');
      })
      .catch(error => console.error('Ошибка:', error));
  };

  const openModal = (image) => {
    setModalImage(image);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalImage('');
  };

  const nextStep = () => {
    if (recipe && currentStepIndex < recipe.step_images.length - 1) {
       setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const prevStep = () => {
    if (currentStepIndex > 0) {
        setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  if (isLoading || !recipe) return (
    <div className="loading-container">
      <div className="spinner"></div>
      <p className="loading-text">Пожалуйста подождите,мы используем бесплатный хостинг:)</p>
    </div>
  );

  const parsedIngredients = recipe.ingredients_list.map(ingredient => {
    const match = ingredient.match(/^(\d+\s*\w*)\s*(.*)$/);
    return match ? { quantity: match[1], name: match[2] } : { quantity: '', name: ingredient };
  });

  return (
    <div className="recipe-details">
      <div className="recipe-header">
        <h2>{recipe.name || 'Без названия'}</h2>
        <button onClick={toggleFavorite} className="favorite-btn">
          <FaHeart className={`favorite-icon ${isFavorite ? 'active' : ''}`} />
        </button>
      </div>
      <div className="recipe-details-container">
        <div className="recipe-image-section">
          <div className="image-container">
            <div className="main-image-container">
              <img
                src={recipe.image}
                alt={recipe.name}
                className="main-image"
                onClick={() => openModal(0)}
              />
            </div>
            <div className="step-images">
              {recipe.step_images.map((image, index) => (
                <img
                  key={index}
                  src={image}
                  alt={`Step ${index + 1}`}
                  className="step-image"
                  onClick={() => openModal(index)}
                />
              ))}
            </div>
          </div>
          <div className="recipe-stats">
            <span>Время: {recipe.cooking_time || 'Не указано'} мин</span>
            <span>Калории: {recipe.calories || 'Не указано'} ккал</span>
          </div>
        </div>
        <div className="recipe-info">
          <div className="ingredients-list">
            <h3>Ингредиенты</h3>
            {parsedIngredients.length > 0 ? (
              parsedIngredients.map((ingredient, index) => (
                <div key={index} className="ingredient-item">
                  <span className="ingredient-quantity">{ingredient.quantity}</span>
                  <span className="ingredient-name">{ingredient.name}</span>
                </div>
              ))
            ) : (
              <p>Ингредиенты отсутствуют</p>
            )}
          </div>
          <div className="description-list">
            <h3>Описание</h3>
            <p>{recipe.description || 'Описание отсутствует'}</p>
          </div>
        </div>
      </div>

      <div className="comments-section">
        <h3>Комментарии</h3>
        {comments.length > 0 ? (
          comments.map(comment => (
            <div key={comment.id} className="comment">
              <p>
                <strong>{comment.author}</strong> (
                {new Date(comment.created_at).toLocaleString()})
              </p>
              <p>{comment.text}</p>
            </div>
          ))
        ) : (
          <p>Пока нет комментариев.</p>
        )}
        {user ? (
          <div className="comment-form">
            <h4>Оставить комментарий</h4>
            <form onSubmit={handleCommentSubmit}>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Напишите ваш комментарий..."
              />
              <button type="submit" className="comment-btn">Отправить</button>
            </form>
          </div>
        ) : (
          <p>
            Чтобы оставить комментарий,{' '}
            <button onClick={onOpenLogin}>войдите</button> или{' '}
            <button onClick={onOpenRegister}>зарегистрируйтесь</button>.
          </p>
        )}
      </div>

      {isModalOpen && recipe.step_images.length > 0 && (
        <div className="image-modal" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={closeModal}>
              <FaTimes />
            </button>
            <div className="step-modal-content">
              <img
                src={recipe.step_images[currentStepIndex]}
                alt={`Step ${currentStepIndex + 1}`}
                className="modal-image"
              />
              <p className="step-instruction">
                {recipe.step_instructions[currentStepIndex] || `Шаг ${currentStepIndex + 1}: Инструкция отсутствует`}
              </p>

              <div className="modal-navigation">
                <button
                  className="nav-btn"
                  onClick={prevStep}
                  disabled={currentStepIndex === 0}
                >
                  <FaArrowLeft />
                </button>
                <span>{`${currentStepIndex + 1} / ${recipe.step_images.length}`}</span>
                <button
                  className="nav-btn"
                  onClick={nextStep}
                  disabled={currentStepIndex === recipe.step_images.length - 1}
                >
                  <FaArrowRight />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RecipeDetails;