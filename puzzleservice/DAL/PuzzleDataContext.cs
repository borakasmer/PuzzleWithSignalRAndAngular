using Microsoft.EntityFrameworkCore;

public class PuzzleDataContext : DbContext
  {
    public DbSet<FrozenPuzzle> FrozenPuzzle { get; set; }

    public DbSet<PuzzleCategory> PuzzleCategories { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
      base.OnConfiguring(optionsBuilder);

      optionsBuilder.UseSqlServer("******;Initial Catalog=DevnotDB;Persist Security Info=False;User ID=******;Password=******;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;");
    }
  }