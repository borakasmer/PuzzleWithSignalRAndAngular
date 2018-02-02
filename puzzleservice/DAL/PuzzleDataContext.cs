using Microsoft.EntityFrameworkCore;

public class PuzzleDataContext : DbContext
  {
    public DbSet<FrozenPuzzle> FrozenPuzzle { get; set; }

    public DbSet<PuzzleCategory> PuzzleCategories { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
      base.OnConfiguring(optionsBuilder);

      optionsBuilder.UseSqlServer("Server=******;Initial Catalog=******;Persist Security Info=False;User ID=devnot;Password=******;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;");
    }
  }