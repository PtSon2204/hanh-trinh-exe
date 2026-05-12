using System.Collections.Generic;

namespace TheALMAProject.Application.Constants
{
    public static class UserRoleNames
    {
        public const string Admin = "Admin";
        public const string ProductManager = "Product Manager";
        public const string OrderManager = "OrderMgr";
        public const string Customer = "Customer";

        public static readonly HashSet<string> Allowed = new()
        {
            Admin,
            ProductManager,
            OrderManager,
            Customer
        };
    }
}
