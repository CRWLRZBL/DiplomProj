using CourseProjectAPI.Data;
using CourseProjectAPI.DTOs;
using CourseProjectAPI.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace CourseProjectAPI.Services
{
    /// <summary>
    /// Сервис для аутентификации и авторизации пользователей
    /// </summary>
    public class AuthService : IAuthService
    {
        private readonly AutoSalonContext _context;

        /// <summary>
        /// Конструктор сервиса аутентификации
        /// </summary>
        /// <param name="context">Контекст базы данных</param>
        public AuthService(AutoSalonContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Аутентификация пользователя по email и паролю
        /// Проверяет существование пользователя и корректность пароля
        /// </summary>
        /// <param name="email">Email пользователя</param>
        /// <param name="password">Пароль пользователя</param>
        /// <returns>Кортеж: (пользователь, сообщение об ошибке). Если аутентификация успешна - возвращается пользователь и null в error. Если неуспешна - null в user и сообщение об ошибке</returns>
        public async Task<(User? user, string? error)> AuthenticateAsync(string email, string password)
        {
            // Поиск пользователя по email с загрузкой связанных данных (роль и профиль)
            var user = await _context.Users
                .Include(u => u.Role)
                .Include(u => u.UserProfiles)
                .FirstOrDefaultAsync(u => u.Email == email);

            // Проверка существования пользователя
            if (user == null)
            {
                return (null, "Неверный email или пароль");
            }

            // Проверка активности учетной записи
            if (!user.IsActive)
            {
                return (null, "Аккаунт заблокирован");
            }

            // Проверка пароля (в реальном приложении здесь должно быть хеширование и сравнение хешей)
            if (user.PasswordHash != password)
            {
                return (null, "Неверный email или пароль");
            }

            // Аутентификация успешна
            return (user, null);
        }

        /// <summary>
        /// Создание сессии для аутентифицированного пользователя
        /// Устанавливает cookie или токен для поддержания сессии пользователя
        /// </summary>
        /// <param name="user">Аутентифицированный пользователь</param>
        /// <param name="httpContext">HTTP контекст для установки cookie/токена</param>
        public async Task SignInAsync(User user, HttpContext httpContext)
        {
            // В реальном приложении здесь может быть:
            // 1. Установка cookie с данными пользователя
            // 2. Генерация JWT токена и установка его в cookie или заголовок
            // 3. Создание записи сессии в базе данных
            // 4. Установка claims в HttpContext.User

            // Пример установки cookie (закомментировано, так как требует дополнительной настройки):
            // var claims = new List<Claim>
            // {
            //     new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
            //     new Claim(ClaimTypes.Email, user.Email),
            //     new Claim(ClaimTypes.Role, user.Role.RoleName)
            // };
            // var claimsIdentity = new ClaimsIdentity(claims, "CookieAuth");
            // await httpContext.SignInAsync("CookieAuth", new ClaimsPrincipal(claimsIdentity));

            // Для текущей реализации просто сохраняем задачу как завершенную
            await Task.CompletedTask;
        }

        /// <summary>
        /// Вход пользователя в систему (метод для обратной совместимости)
        /// </summary>
        /// <param name="loginDto">DTO с данными для входа (email и пароль)</param>
        /// <returns>DTO пользователя или null, если вход не удался</returns>
        public async Task<UserDto> LoginAsync(LoginDto loginDto)
        {
            // Используем новый метод AuthenticateAsync
            var (user, error) = await AuthenticateAsync(loginDto.Email, loginDto.Password);

            if (user == null)
            {
                return null;
            }

            // Преобразуем модель User в DTO
            return new UserDto
            {
                Id = user.UserId,
                Email = user.Email,
                FirstName = user.UserProfiles?.FirstName ?? string.Empty,
                LastName = user.UserProfiles?.LastName ?? string.Empty,
                Phone = user.UserProfiles?.Phone ?? string.Empty,
                RoleName = user.Role?.RoleName ?? string.Empty,
                Role = user.Role != null ? new RoleDto { Name = user.Role.RoleName } : null
            };
        }

        /// <summary>
        /// Проверка существования пользователя с указанным email
        /// </summary>
        /// <param name="email">Email для проверки</param>
        /// <returns>true, если пользователь с таким email существует, иначе false</returns>
        public async Task<bool> UserExistsAsync(string email)
        {
            return await _context.Users.AnyAsync(u => u.Email == email);
        }

        /// <summary>
        /// Регистрация нового пользователя в системе
        /// Создает запись пользователя и его профиль с ролью "Client" по умолчанию
        /// </summary>
        /// <param name="registerDto">DTO с данными для регистрации</param>
        /// <returns>DTO созданного пользователя</returns>
        /// <exception cref="InvalidOperationException">Выбрасывается, если пользователь с таким email уже существует или роль "Client" не найдена</exception>
        public async Task<UserDto> RegisterAsync(RegisterUserDto registerDto)
        {
            // Проверяем, существует ли пользователь с таким email
            if (await UserExistsAsync(registerDto.Email))
            {
                throw new InvalidOperationException("User with this email already exists");
            }

            // Получаем роль "Client" (по умолчанию для новых пользователей)
            var clientRole = await _context.Roles
                .FirstOrDefaultAsync(r => r.RoleName == "Client");

            if (clientRole == null)
            {
                throw new InvalidOperationException("Client role not found in database");
            }

            // Создаем нового пользователя с базовыми данными
            var newUser = new User
            {
                Email = registerDto.Email,
                PasswordHash = registerDto.Password, // В реальном приложении здесь должно быть хеширование пароля (например, BCrypt)
                RoleId = clientRole.RoleId,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Users.Add(newUser);
            await _context.SaveChangesAsync();

            // Создаем профиль пользователя с дополнительной информацией
            var userProfile = new UserProfiles
            {
                UserId = newUser.UserId,
                FirstName = registerDto.FirstName,
                LastName = registerDto.LastName,
                Phone = string.IsNullOrWhiteSpace(registerDto.Phone) ? null : registerDto.Phone
            };

            _context.UserProfiles.Add(userProfile);
            await _context.SaveChangesAsync();

            // Возвращаем DTO созданного пользователя
            return new UserDto
            {
                Id = newUser.UserId,
                Email = newUser.Email,
                FirstName = userProfile.FirstName,
                LastName = userProfile.LastName,
                Phone = userProfile.Phone ?? string.Empty,
                RoleName = clientRole.RoleName,
                Role = new RoleDto { Name = clientRole.RoleName }
            };
        }

        public async Task<(UserDto? user, string? error)> UpdateProfileAsync(int userId, UpdateProfileDto dto)
        {
            if (userId <= 0)
                return (null, "Некорректный идентификатор пользователя");

            var firstName = dto.FirstName?.Trim() ?? string.Empty;
            var lastName = dto.LastName?.Trim() ?? string.Empty;
            if (string.IsNullOrWhiteSpace(firstName) || string.IsNullOrWhiteSpace(lastName))
                return (null, "Укажите имя и фамилию");

            var user = await _context.Users
                .Include(u => u.Role)
                .Include(u => u.UserProfiles)
                .FirstOrDefaultAsync(u => u.UserId == userId);

            if (user == null)
                return (null, "Пользователь не найден");

            if (!user.IsActive)
                return (null, "Аккаунт заблокирован");

            var phone = string.IsNullOrWhiteSpace(dto.Phone) ? null : dto.Phone.Trim();

            if (user.UserProfiles == null)
            {
                user.UserProfiles = new UserProfiles
                {
                    UserId = user.UserId,
                    FirstName = firstName,
                    LastName = lastName,
                    Phone = phone
                };
                _context.UserProfiles.Add(user.UserProfiles);
            }
            else
            {
                user.UserProfiles.FirstName = firstName;
                user.UserProfiles.LastName = lastName;
                user.UserProfiles.Phone = phone;
            }

            user.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return (MapToUserDto(user), null);
        }

        private static UserDto MapToUserDto(User user) => new()
        {
            Id = user.UserId,
            Email = user.Email,
            FirstName = user.UserProfiles?.FirstName ?? string.Empty,
            LastName = user.UserProfiles?.LastName ?? string.Empty,
            Phone = user.UserProfiles?.Phone ?? string.Empty,
            RoleName = user.Role?.RoleName ?? string.Empty,
            Role = user.Role != null ? new RoleDto { Name = user.Role.RoleName } : null
        };
    }
}
