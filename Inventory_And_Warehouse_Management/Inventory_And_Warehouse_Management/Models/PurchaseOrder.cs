using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text;
using System.Text.Json.Serialization;

namespace Inventory_And_Warehouse_Management.Models
{
    public class PurchaseOrder
    {
        [Key]
        [JsonIgnore]
        public int PurchaseOrderId { get; set; }
        public string Status { get; set; }
        public decimal TotalAmount { get; set; }
        public DateTime OrderDate { get; set; }

        //Relationship between PurchaseOrder and Supplier
        [ForeignKey("supplier")]
        public int SupplierId { get; set; }
        [JsonIgnore]
        public Supplier supplier { get; set; }

        //Relationship between PurchaseOrder and User
        [ForeignKey("user")]
        public int UserId { get; set; }
        [JsonIgnore]
        public User user { get; set; }

        //Relationship between PurchaseOrder and PurchaseOrderItem
        [InverseProperty("purchaseOrder")]
        [JsonIgnore]
        public List<PurchaseOrderItem>? purchaseOrderItems { get; set; }

    }
}
