using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Runtime.Serialization.Formatters.Binary;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;

namespace puzzleservice.Controllers
{
    [Route("api/[controller]")]
    public class PuzzlesController : Controller
    {
        private static Dictionary<string, List<Ipuzzle>> cache = new Dictionary<string, List<Ipuzzle>>();
        public List<PuzzleCategory> Get()
        {
            using (PuzzleDataContext dbContext = new PuzzleDataContext())
            {
                return dbContext.PuzzleCategory.ToList();
            }
        }
        // GET api/values/5
        [HttpGet("{id}/{connectionID}/{isReset}")]
        public List<Ipuzzle> Get(int id, string connectionID, Boolean isReset = false)
        {
            List<Ipuzzle> list = null; // Şişme ihtimali var. Sürekli Cmd+R mesela.
            List<Ipuzzle> cloneList = null;
            List<Ipuzzle> randomList = null; //Enson gönderilen lİST
            if (isReset) { cache.Clear(); }
            if (!cache.ContainsKey(connectionID))
            {
                using (PuzzleDataContext dbContext = new PuzzleDataContext())
                {
                    //Her Seferinde Random Almak lazımdı. Ama Hem Main hem de Control aynı Random List'i almalı.
                    Random rnd = new Random();
                    list = dbContext.FrozenPuzzle.Where(fr => fr.RefCategoryID == id)
                    .OrderBy<Ipuzzle, int>((item) => rnd.Next()).Take(6).ToList<Ipuzzle>();
                    cloneList = CloneList<Ipuzzle>(list.OrderBy<Ipuzzle, int>((item) => rnd.Next()).ToList());
                    cloneList.ForEach(f => f.ID = CloneID(f.ID)); //UniqID yapmaz isek kartları ayırt edemeyiz

                    list.AddRange(cloneList);

                    randomList = list.OrderBy<Ipuzzle, int>((item) => rnd.Next()).Take(12).ToList<Ipuzzle>();

                    cache.Add(connectionID, randomList);
                }
            }
            else
            {
                randomList = cache[connectionID];
                cache.Remove(connectionID);
            }
            return randomList;
        }
        //Asla FrozenPuzzle table'da Resimlerde ID içerisinde '0' karakteri bulunduran bir değer olması. Örnek ID==10 olan kayıt silindi. Tekrar insert edilerek 19 yapıldı..
        /* [HttpGet("{id}")]
        public int CloneID(int ID)
        {
            if (ID < 100)
            {
                return int.Parse(ID.ToString() + "0" + ID.ToString());
            }
            else
            {
                return int.Parse(ID.ToString().Split('0')[0]);
            }
        } */
        [HttpGet("{id}")]
        public int CloneID(int ID)
        {
            if (ID < 100)
            {
                return int.Parse(ID.ToString() + "0" + ID.ToString() + "0");
            }
            else
            {
                var firstID = ID.ToString().Substring(0, ID.ToString().Length / 2);
                return int.Parse(firstID.Substring(0, firstID.Length - 1));
            }
        }
        //Eşlenik resimler yeni referans değerleri ile oluşurlar.
        public static List<T> CloneList<T>(List<T> oldList)
        {
            BinaryFormatter formatter = new BinaryFormatter();
            MemoryStream stream = new MemoryStream();
            formatter.Serialize(stream, oldList);
            stream.Position = 0;
            return (List<T>)formatter.Deserialize(stream);
        }
    }
}
