using CourseProjectAPI.DTOs;
using CourseProjectAPI.Models;
using Microsoft.AspNetCore.Http;

namespace CourseProjectAPI.Services
{
    /// <summary>
    /// Интерфейс сервиса аутентификации и авторизации пользователей
    /// </summary>
    public interface IAuthService
    {
        /// <summary>
        /// Аутентификация пользователя по email и паролю
        /// </summary>
        /// <param name="email">Email пользователя</param>
        /// <param name="password">Пароль пользователя</param>
        /// <returns>Кортеж: (пользователь, сообщение об ошибке)</returns>
        Task<(User? user, string? error)> AuthenticateAsync(string email, string password);

        /// <summary>
        /// Создание сессии для аутентифицированного пользователя
        /// </summary>
        /// <param name="user">Аутентифицированный пользователь</param>
        /// <param name="httpContext">HTTP контекст для установки cookie/токена</param>
        Task SignInAsync(User user, HttpContext httpContext);

        /// <summary>
        /// Вход пользователя в систему (старый метод для обратной совместимости)
        /// </summary>
        Task<UserDto> LoginAsync(LoginDto loginDto);

        /// <summary>
        /// Регистрация нового пользователя
        /// </summary>
        Task<UserDto> RegisterAsync(RegisterUserDto registerDto);

        /// <summary>
        /// Проверка существования пользователя с указанным email
        /// </summary>
        Task<bool> UserExistsAsync(string email);

        /// <summary>
        /// Обновление данных профиля пользователя (имя, фамилия, телефон)
        /// </summary>
        Task<(UserDto? user, string? error)> UpdateProfileAsync(int userId, UpdateProfileDto dto);
    }
}
