using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Text;

namespace Inventory_And_Warehouse_Management
{
    internal class ProjectContext : DbContext
    {
        //1- register models



        //2- connect to database
        protected override void OnConfiguring(DbContextOptionsBuilder options)
        {
            options.UseSqlServer(
            "Server=.;Database=Inventory_And_Warehouse_Management_DB;Trusted_Connection=True;TrustServerCertificate=True;"
            );
        }
    }
}
