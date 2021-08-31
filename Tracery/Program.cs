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
                trace.Start();
                if (trace.vars.ContainsKey("answerKey"))
                {
                    string answerKey = trace.vars["answerKey"];
                    int max = Math.Min(5, trace.Dict[answerKey].Length-1);
                    for (int i = 0; i <= trace.Rand.Next(1, max); i++)
                    {
                        Console.WriteLine($" ({i}) {trace.ParseKey(answerKey)}");
                    }
                }
                Console.WriteLine($"Seed: {seed}");

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
