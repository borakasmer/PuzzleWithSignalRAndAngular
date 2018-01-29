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
        private static Dictionary<string, List<Ipuzzle>> cache=new Dictionary<string, List<Ipuzzle>>();
        public List<PuzzleCategory> Get()
        {
            using (PuzzleDataContext dbContext = new PuzzleDataContext())
            {
                return dbContext.PuzzleCategories.ToList();
            }
        }
        // GET api/values/5
        [HttpGet("{id}/{connectionID}")]
        public List<Ipuzzle> Get(int id, string connectionID)
        {
            List<Ipuzzle> list=null; // Şişme ihtimali var. Sürekli Cmd+R mesela.
            if (!cache.ContainsKey(connectionID))
            {
                using (PuzzleDataContext dbContext = new PuzzleDataContext())
                {
                    //Her Seferinde Random Almak lazımdı. Ama Hem Main hem de Control aynı Random List'i almalı.
                    Random rnd = new Random();
                    list = dbContext.FrozenPuzzle.Where(fr => fr.RefCategoryID == id)
                    .OrderBy<Ipuzzle, int>((item) => rnd.Next()).ToList<Ipuzzle>();
                    cache.Add(connectionID, list);                    
                }
            }
            else
            {
                list=cache[connectionID];
                cache.Remove(connectionID);
            }
            return list;
        }

    }
}
