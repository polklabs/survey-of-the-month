using System;
using System.Collections.Generic;
using System.Text;
using System.Text.RegularExpressions;

namespace Tracery
{
    class Trace
    {
        public readonly Dictionary<string, string[]> grammarDict;
        public readonly Dictionary<string, string[]> customDict;
        public Dictionary<string, string> vars = new Dictionary<string, string>();
        public Dictionary<string, HashSet<string>> seen = new Dictionary<string, HashSet<string>>();
        public Random Rand;

        public Trace(Dictionary<string, string[]> grammarDict, Dictionary<string, string[]> customDict)
        {
            this.grammarDict = grammarDict;
            this.customDict = customDict;
            Rand = new Random();
        }

        public int SetSeed(int? seed = null)
        {
            if (seed == null)
            {
                seed = Environment.TickCount;
            }
            Rand = new Random(seed.GetValueOrDefault());
            return seed.GetValueOrDefault();
        }

        public void Start(string origin = "origin")
        {
            vars = new Dictionary<string, string>();
            seen = new Dictionary<string, HashSet<string>>();
            Console.WriteLine(ParseKey(origin));
        }

        string GetRandom(string key)
        {
            var dict = grammarDict;
            if (!dict.ContainsKey(key)) dict = customDict;
            if (!dict.ContainsKey(key)) return key;
            return dict[key][Rand.Next(0, dict[key].Length)];
        }

        string ModString(string value, string mod)
        {
            switch(mod)
            {
                case "capitalize":
                    return value.Substring(0, 1).ToUpper() + value.Substring(1);
                case "a":
                    return "aeiouAEIOU".IndexOf(value[0]) >= 0 ? $"an {value}" : $"a {value}";
                case "ed":
                    if (value.EndsWith("e")) return $"{value}d";
                    return $"{value}ed";
                case "s":
                    if (value.EndsWith("s")) return $"{value}es";
                    return $"{value}s";
                case "range":
                    string[] values = value.Split(":");
                    int start = int.Parse(values[0]);
                    int end = int.Parse(values[1]);
                    return Rand.Next(start, end).ToString();
                default:
                    Console.WriteLine($"Unknown Mod: {mod}");
                    return value;
            }
        }

        void ParseVariables(string variables)
        {
            Regex re = new Regex(@"(\[(?<key>.+?):(?<value>.+?)\])+?");
            foreach(Match m in re.Matches(variables))
            {
                string key = m.Groups["key"].ToString();
                string value = m.Groups["value"].ToString();
                value = ParseString(value);

                if (vars.ContainsKey(key))
                {
                    vars[key] = value;
                }
                else
                {
                    vars.Add(key, value);
                }
            }
        }

        string ParseString(string value)
        {            
            Regex varsRe = new Regex(@"^(?<vars>(\[[a-zA-Z0-9_:#]+?\])*)");
            value = varsRe.Replace(value, m =>
            {
                ParseVariables(m.Groups["vars"].ToString());
                return "";
            });

            Regex re = new Regex(@"(#(?<vars>(\[[a-zA-Z0-9_:#]+?\])*?)(?<key>[a-zA-Z0-9_:]+)\.?(?<mod>[a-zA-Z]*?)#)+?");

            return re.Replace(value, m => {
                string variables = m.Groups["vars"].ToString();
                string key = m.Groups["key"].ToString();
                string mod = m.Groups["mod"].ToString();

                if (!string.IsNullOrEmpty(variables))
                {
                    ParseVariables(variables);
                }

                string toReturn = ParseKey(key);
                if (!string.IsNullOrEmpty(mod))
                {
                    toReturn = ModString(toReturn, mod);
                }

                return toReturn;
            });
        }

        public string ParseKey(string key)
        {
            //Console.Write(key + ": ");
            if (vars.ContainsKey(key))
            {
                //Console.WriteLine(vars[key]);
                return vars[key];
            }

            var dict = grammarDict;
            if (!dict.ContainsKey(key)) dict = customDict;
            if (!dict.ContainsKey(key)) return ParseString(GetRandom(key));

            // Make sure that we haven't already chosen this option
            string value = ParseString(GetRandom(key));
            // Make sure there is a valid string set
            if (!seen.ContainsKey(key))
            {
                seen.Add(key, new HashSet<string>());
            }

            // Only try again if we havent seen all the keys in the list
            if (seen[key].Count < dict[key].Length)
            {
                while (seen[key].Contains(value))
                {
                    value = ParseString(GetRandom(key));
                }
                seen[key].Add(value);
            }
            else
            {
                seen[key] = new HashSet<string>();
            }
            return value;
        }
    }
}
