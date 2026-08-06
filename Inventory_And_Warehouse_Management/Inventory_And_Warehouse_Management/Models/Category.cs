using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text;
using System.Text.Json.Serialization;

namespace Inventory_And_Warehouse_Management.Models
{
    public class Category
    {
        [Key]
        [JsonIgnore]
        public int CategoryId { get; set; }

        [Required]
        public string Name { get; set; }
        public string Description { get; set; }


        //product has Category
        [InverseProperty("category")]
        [JsonIgnore]
        public List<Product>? products { get; set; }
    }
}
