using System;
using System.Collections.Generic;
using System.IO;
using Newtonsoft.Json;

namespace Tracery
{
    class Program
    {
        static void Main(string[] args)
        {
            Trace trace = new Trace(LoadJson());
            while (true)
            {
                int seed = trace.SetSeed();
                trace.Start("question");
                if (trace.vars.ContainsKey("answerKey"))
                {
                    string answerKey = trace.vars["answerKey"];
                    int max = trace.Rand.Next(2, 5);
                    if (answerKey == "yesNo") max = 1;
                    for (int i = 0; i <= max; i++)
                    {
                        Console.WriteLine($" ({i}) {trace.ParseKey(answerKey)}");
                    }
                }

                ConsoleKeyInfo key = Console.ReadKey();
                if (key.Key == ConsoleKey.Enter) break;
                Console.WriteLine("\n");
            }
        }

        static Dictionary<string, string[]> LoadJson()
        {
            using (StreamReader r = new StreamReader("survey.json"))
            {
                string json = r.ReadToEnd();
                return JsonConvert.DeserializeObject<Dictionary<string, string[]>>(json);
            }
        }
    }
}
