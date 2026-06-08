using CourseProjectAPI.DTOs;
using CourseProjectAPI.Services;
using Microsoft.AspNetCore.Mvc;

namespace CourseProjectAPI.Controllers
{
    /// <summary>
    /// Контроллер для обработки запросов аутентификации и авторизации пользователей
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        /// <summary>
        /// Конструктор контроллера аутентификации
        /// </summary>
        /// <param name="authService">Сервис для работы с аутентификацией пользователей</param>
        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        /// <summary>
        /// Эндпоинт для аутентификации пользователя в системе
        /// </summary>
        /// <param name="loginDto">DTO с данными для входа (email и пароль)</param>
        /// <returns>
        /// 200 OK - успешная аутентификация, возвращает данные пользователя
        /// 401 Unauthorized - неверные учетные данные или заблокированный аккаунт
        /// 400 BadRequest - ошибка при обработке запроса
        /// </returns>
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto loginDto)
        {
            try
            {
                // Аутентификация пользователя: проверка email и пароля
                // Метод возвращает кортеж: (пользователь, сообщение об ошибке)
                var (user, error) = await _authService.AuthenticateAsync(loginDto.Email, loginDto.Password);

                // Если аутентификация не удалась, возвращаем ошибку 401
                if (user == null)
                {
                    return Unauthorized(new { Error = error });
                }

                // Создание сессии/токена (например, установка cookie)
                // Метод SignInAsync устанавливает сессию пользователя в HttpContext
                await _authService.SignInAsync(user, HttpContext);

                // Формирование DTO пользователя для ответа
                // Включаем только необходимые данные для безопасности
                var userDto = new UserDto
                {
                    Id = user.UserId,
                    Email = user.Email,
                    FirstName = user.UserProfiles?.FirstName ?? string.Empty,
                    LastName = user.UserProfiles?.LastName ?? string.Empty,
                    Phone = user.UserProfiles?.Phone ?? string.Empty,
                    RoleName = user.Role?.RoleName ?? string.Empty,
                    Role = new RoleDto
                    {
                        Name = user.Role?.RoleName ?? string.Empty
                    }
                };

                // FullName вычисляется автоматически из FirstName и LastName
                return Ok(userDto);
            }
            catch (Exception ex)
            {
                // Обработка неожиданных ошибок
                return BadRequest(new { Error = ex.Message });
            }
        }

        /// <summary>
        /// Эндпоинт для регистрации нового пользователя в системе
        /// </summary>
        /// <param name="registerDto">DTO с данными для регистрации (email, пароль, имя, фамилия, телефон)</param>
        /// <returns>
        /// 200 OK - успешная регистрация, возвращает сообщение об успехе и ID созданного пользователя
        /// 400 BadRequest - ошибка регистрации (например, пользователь с таким email уже существует)
        /// </returns>
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterUserDto registerDto)
        {
            try
            {
                // Регистрация нового пользователя
                // Метод создает пользователя в базе данных с ролью "Client" по умолчанию
                var user = await _authService.RegisterAsync(registerDto);

                // Возвращаем успешный результат с информацией о созданном пользователе
                return Ok(new { Message = "User registered successfully", UserId = user.UserId });
            }
            catch (InvalidOperationException ex)
            {
                // Обработка бизнес-логических ошибок (например, дублирование email)
                return BadRequest(new { Error = ex.Message });
            }
            catch (Exception ex)
            {
                // Обработка неожиданных ошибок
                return BadRequest(new { Error = ex.Message });
            }
        }

        /// <summary>
        /// Обновление профиля пользователя (имя, фамилия, телефон)
        /// </summary>
        [HttpPut("profile/{userId:int}")]
        public async Task<IActionResult> UpdateProfile(int userId, [FromBody] UpdateProfileDto dto)
        {
            try
            {
                var (user, error) = await _authService.UpdateProfileAsync(userId, dto);
                if (user == null)
                    return BadRequest(new { Error = error ?? "Не удалось обновить профиль" });

                return Ok(user);
            }
            catch (Exception ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }
    }
}
