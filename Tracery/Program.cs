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
            Dictionary<string, string[]> custom = new Dictionary<string, string[]>();
            custom.Add("person", new string[] { "kate", "madison", "andrew", "shireen", "emma", "avah", "paulina", "jasmine" });
            custom.Add("monthNow", new string[] { "September" });

            Trace trace = new Trace(LoadJson(), custom);
            while (true)
            {
                trace.SetSeed();
                trace.Start("question");
                if (trace.vars.ContainsKey("answerKey"))
                {
                    string answerKey = trace.vars["answerKey"];
                    int max = trace.Rand.Next(2, 5);
                    if (answerKey == "yesNo") max = 1;

                    // Fixed length multiple choice
                    if (trace.vars.ContainsKey("answerKeyCount"))
                    {
                        max = int.Parse(trace.vars["answerKeyCount"])-1;
                    }

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
