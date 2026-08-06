using Inventory_And_Warehouse_Management.Models;
using Microsoft.AspNetCore.Mvc;
using System;

namespace Inventory_And_Warehouse_Management.Controllers
{
    [ApiController]
    [Route("InventoryLevel")]
    public class InventoryLevelController: ControllerBase
    {
        private ProjectContext Context;
        public InventoryLevelController(ProjectContext _context)
        {
            Context = _context;
        }


        //Case1: Create a new InventoryLevel record
        [HttpPost("AddInventoryLevel")]
        public void AddInventoryLevel(InventoryLevel il)
        {
            context.inventoryLevels.Add(il);
            context.SaveChanges();
        }


    }



}
