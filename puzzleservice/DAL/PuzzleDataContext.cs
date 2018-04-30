using Microsoft.EntityFrameworkCore;

public class PuzzleDataContext : DbContext
  {
    public DbSet<FrozenPuzzle> FrozenPuzzle { get; set; }

    public DbSet<PuzzleCategory> PuzzleCategory { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
      base.OnConfiguring(optionsBuilder);

      optionsBuilder.UseSqlServer("Server=tcp:devnot.database.windows.net,1433;Initial Catalog=DevnotDB;Persist Security Info=False;User ID=devnot;Password=Abc-def-ghi-jkl;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;");
    }
  }