using System;

namespace CACC.DAO
{
    public sealed class StaffIdentityConflictException : Exception
    {
        public StaffIdentityConflictException()
            : base("Ya existe un usuario o miembro del staff con ese DNI o email.")
        {
        }
    }
}
