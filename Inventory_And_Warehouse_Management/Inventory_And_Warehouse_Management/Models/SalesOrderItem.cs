using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;

namespace Inventory_And_Warehouse_Management.Models
{
    [PrimaryKey(nameof(SalesOrderId), nameof(ProductId))]
    public class SalesOrderItem
    {
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int SalesOrderItemId { get; set; }

        [Required]
        public int Quantity { get; set; }

        [Required]
        public decimal UnitPrice { get; set; }

        [Required]
        public decimal TotalPrice { get; set; }



        // Relationship between SalesOrderItem and SalesOrder
        [ForeignKey("SalesOrderId")]
        public int SalesOrderId { get; set; }
        [JsonIgnore]
        public SalesOrder? salesOrder { get; set; }


        // Relationship between SalesOrderItem and Product
        [ForeignKey("ProductId")]
        public int ProductId { get; set; }
        [JsonIgnore]
        public Product? product { get; set; }

    }
}
