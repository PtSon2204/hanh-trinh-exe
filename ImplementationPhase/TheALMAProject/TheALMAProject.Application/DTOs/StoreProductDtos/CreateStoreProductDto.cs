using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TheALMAProject.Application.DTOs.StoreProductDtos
{
    public class CreateStoreProductDto
    {
        public int? BaseProductId { get; set; } = null!;
        public int? UniversityId { get; set; } = null!;
        public string Name { get; set; } = null!;
        public string? Description { get; set; }
        public decimal Price { get; set; }
        public string? ImageUrl { get; set; }
        public bool IsCustomizable { get; set; } = false;
    }
}
