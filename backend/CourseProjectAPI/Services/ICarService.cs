using CourseProjectAPI.DTOs;
using CourseProjectAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace CourseProjectAPI.Services
{
    public interface ICarService
    {
        Task<List<CarDto>> GetAvailableCarsAsync(string brand = null, string bodyType = null);
        Task<List<CarDto>> GetAllCarsAsync();
        Task<CarDto> GetCarByIdAsync(int id);
        Task<CarDto> UpdateCarAsync(int id, UpdateCarDto updateDto);
        Task<List<CarDto>> GetCatalogListingsAsync(string? listingType = null, string? brand = null, string? bodyType = null, string? search = null, bool publishedOnly = true);
        Task<CarDto> CreateCarListingAsync(SaveCarListingDto dto);
        Task<CarDto> UpdateCarListingAsync(int id, SaveCarListingDto dto);
        Task<bool> DeleteCarListingAsync(int id);
        Task<List<ModelDto>> GetAvailableModelsAsync(string brand = null, string bodyType = null);
        Task<ModelDto> GetModelByIdAsync(int id);
        Task<List<Configuration>> GetConfigurationsAsync(int carId);
        Task<List<Configuration>> GetConfigurationsByModelIdAsync(int modelId);
        Task<List<ColorDto>> GetAvailableColorsAsync();
        Task<List<EngineDto>> GetAvailableEnginesAsync(int? modelId = null);
        Task<List<TransmissionDto>> GetAvailableTransmissionsAsync(int? modelId = null);
    }
}
