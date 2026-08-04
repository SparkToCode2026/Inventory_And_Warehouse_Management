using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace Inventory_And_Warehouse_Management.Models
{
    public class Category
    {
        [Key]
        public int CategoryId { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
    }
}
