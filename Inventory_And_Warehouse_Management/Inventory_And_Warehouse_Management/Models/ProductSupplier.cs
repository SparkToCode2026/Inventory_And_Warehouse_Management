using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations.Schema;

namespace Inventory_And_Warehouse_Management.Models
{
    [PrimaryKey(nameof(productId), nameof(supplierId))]
    public class ProductSupplier
    {
        //product 
        [ForeignKey("product")]
        public int productId { get; set; }
        public Product product { get; set; }

        //Supplier
        [ForeignKey("supplier")]
        public int supplierId { get; set; }
        public Supplier supplier { get; set; }

    }
}
