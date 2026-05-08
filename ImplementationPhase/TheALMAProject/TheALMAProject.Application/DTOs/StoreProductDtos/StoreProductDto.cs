using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TheALMAProject.Application.DTOs.StoreProductDtos
{
    public class StoreProductDto
    {
        public int ProductId { get; set; }

        public int? BaseProductId { get; set; }

        public int? UniversityId { get; set; }

        public string Name { get; set; } = null!;

        public string? Description { get; set; }

        public decimal Price { get; set; }

        public string? ImageUrl { get; set; }

        public bool IsCustomizable { get; set; }

        public bool IsActive { get; set; }
    }
}
