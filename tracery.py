import json, re

traceMap = dict()

def getRandomString(key):
    return traceMap[key][0]

def parseVars(vars, varDict):
    regex = r"(\[(?P<key>[a-zA-Z]+?):(?P<value>.+?)\])+?"
    matches = re.finditer(regex, vars, re.MULTILINE)
    for match in matches:
        matchDict = match.groupdict()
        varDict[matchDict['key']] = parseKey(matchDict['value'], varDict)

def parseKey(key, prevVarDict):
    string = getRandomString(key)
    regex = r"(#(?P<vars>(\[[a-zA-Z:#]+?\])*?)(?P<key>[a-zA-Z]+?)#)+?"
    matches = re.finditer(regex, string, re.MULTILINE)
    for match in matches:
        matchDict = match.groupdict()
        varDict = json.loads(json.dumps(prevVarDict))

        if 'vars' in matchDict:
            parseVars(matchDict['vars'], varDict)
        newString = parseKey(matchDict['key'], varDict)
        string = string.replace(string[match.start:match.end], newString)

with open('map.json', 'r') as f:
    traceMap = json.loads(f.read())

parseKey('origin', dict())