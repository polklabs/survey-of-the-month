using System;
using System.Collections.Generic;
using System.Text;
using System.Text.RegularExpressions;

namespace Tracery
{
    class Trace
    {
        public readonly Dictionary<string, string[]> Dict;
        public Dictionary<string, string> vars = new Dictionary<string, string>();
        public Dictionary<string, HashSet<string>> seen = new Dictionary<string, HashSet<string>>();
        public Random Rand;

        public Trace(Dictionary<string, string[]> dict)
        {
            Dict = dict;
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

        public void Start()
        {
            vars = new Dictionary<string, string>();
            seen = new Dictionary<string, HashSet<string>>();
            Console.WriteLine(ParseKey("origin"));
        }

        string GetRandom(string key)
        {
            if (!Dict.ContainsKey(key))
            {
                return key;
            }
            int random = Rand.Next(0, Dict[key].Length);
            return Dict[key][random];
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
            // Key Interpolation
            // #character_{#universe_{#universe#}#}# -> #character_{#universe_pixar#}# -> #character_incredibles#
            bool hasInterpolation = true;
            while (hasInterpolation) {
                hasInterpolation = false;
                Regex inerpRe = new Regex(@"{(?<innerKey>#[a-zA-Z0-9_:]+#)}");
                value = inerpRe.Replace(value, m =>
                {
                    hasInterpolation = true;
                    return ParseString(m.Groups["innerKey"].ToString());;
                });
            }
            
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

            string value = GetRandom(key);
            
            if (Dict.ContainsKey(key))
            {
                // Make sure that we haven't already chosen this option
                if (!seen.ContainsKey(key))
                {
                    seen.Add(key, new HashSet<string>());
                }
                if (seen[key].Count < Dict[key].Length)
                {
                    while (seen[key].Contains(value))
                    {
                        value = GetRandom(key);
                    }
                    seen[key].Add(value);
                }
                else
                {
                    seen[key] = new HashSet<string>();
                }
            }
            
            return ParseString(value);
        }
    }
}
