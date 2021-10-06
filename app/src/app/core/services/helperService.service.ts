export class HelperService {

    public static answerKeyToString(key: string): string {
        const phrase = key.replace(/(_|(?<=[a-z])(?=[A-Z]))/gm, ' ');
        const words = phrase.split(' ').filter(x => x.length > 0);
        return words.map(w => w[0].toUpperCase() + w.substr(1)).join(' ');
    }

}
