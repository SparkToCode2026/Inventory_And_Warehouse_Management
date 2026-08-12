using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text;
using System.Text.Json.Serialization;

namespace Inventory_And_Warehouse_Management.Models
{
    [PrimaryKey(nameof(PurchaseOrderId), nameof(ProductId))]
    public class PurchaseOrderItem
    {
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int PurchaseOrderItemId { get; set; }
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal TotalPrice { get; set; }

        //Relationship for PurchaseOrderItem and purchaseOrder
        [ForeignKey("purchaseOrder")]
        public int PurchaseOrderId { get; set; }
        [JsonIgnore]
        public PurchaseOrder purchaseOrder { get; set; }


        //Relationship for PurchaseOrderItem and Product
        [ForeignKey("product")]
        public int ProductId { get; set; }
        [JsonIgnore]
        public Product product { get; set; }
    }
}
