using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;

namespace puzzleservice.Controllers
{
    [Route("api/[controller]")]
    public class PuzzlesController : Controller
    {       
           public List<PuzzleCategory> Get()
        {
            using(PuzzleDataContext dbContext=new PuzzleDataContext())
            {
                return dbContext.PuzzleCategories.ToList();
            }
        }
        // GET api/values/5
        [HttpGet("{id}")]
        public List<Ipuzzle> Get(int id)
        {
            using(PuzzleDataContext dbContext=new PuzzleDataContext())
            {
                return dbContext.FrozenPuzzle.Where(fr=>fr.RefCategoryID==id).ToList<Ipuzzle>();
            }
        }

    }
}
