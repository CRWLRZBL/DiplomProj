namespace CourseProjectAPI.DTOs
{
    /// <summary>
    /// DTO для передачи данных о пользователе
    /// </summary>
    public class UserDto
    {
        /// <summary>
        /// Уникальный идентификатор пользователя
        /// </summary>
        public int Id { get; set; }

        /// <summary>
        /// Уникальный идентификатор пользователя (для обратной совместимости)
        /// </summary>
        public int UserId 
        { 
            get => Id; 
            set => Id = value; 
        }

        /// <summary>
        /// Email адрес пользователя
        /// </summary>
        public string Email { get; set; } = string.Empty;

        /// <summary>
        /// Имя пользователя
        /// </summary>
        public string FirstName { get; set; } = string.Empty;

        /// <summary>
        /// Фамилия пользователя
        /// </summary>
        public string LastName { get; set; } = string.Empty;

        /// <summary>
        /// Полное имя пользователя (Имя + Фамилия)
        /// </summary>
        public string FullName => $"{FirstName} {LastName}".Trim();

        /// <summary>
        /// Телефон пользователя
        /// </summary>
        public string Phone { get; set; } = string.Empty;

        /// <summary>
        /// Название роли пользователя
        /// </summary>
        public string RoleName { get; set; } = string.Empty;

        /// <summary>
        /// Объект роли (для обратной совместимости)
        /// </summary>
        public RoleDto? Role { get; set; }
    }

    /// <summary>
    /// DTO для передачи данных о роли
    /// </summary>
    public class RoleDto
    {
        /// <summary>
        /// Название роли
        /// </summary>
        public string Name { get; set; } = string.Empty;
    }
}
