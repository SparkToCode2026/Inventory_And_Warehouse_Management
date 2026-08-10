using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Inventory_And_Warehouse_Management.Models
{
    [PrimaryKey(nameof(productId), nameof(supplierId))]
    public class ProductSupplier
    {
        //product 
        [ForeignKey("product")]
        public int productId { get; set; }
        [JsonIgnore]
        public Product product { get; set; }

        //Supplier
        [ForeignKey("supplier")]
        public int supplierId { get; set; }
        [JsonIgnore]
        public Supplier supplier { get; set; }

    }
}
