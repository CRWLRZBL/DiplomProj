namespace CourseProjectAPI.DTOs
{
    public class CreateOrderDto
    {
        public int UserId { get; set; }
        public int? CarId { get; set; } // Опционально - если не указан, создаем новый автомобиль
        public int ModelId { get; set; } // Обязательно для создания нового автомобиля
        public int ConfigurationId { get; set; }
        public string? Color { get; set; } // Цвет для нового автомобиля
        public List<int> OptionIds { get; set; } = new();
    }
}
