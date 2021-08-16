const shares: {
    name: string;
    playerId: string;
    quantity: number;
    totalPrice: number;
}[] = JSON.parse(`[
    {
      "name": "Harvey Elliott",
      "playerId": "harvey-elliott",
      "quantity": 300,
      "totalPrice": 92200
    },
    {
      "name": "Kevin de Bruyne",
      "playerId": "kevin-de-bruyne",
      "quantity": 100,
      "totalPrice": 49600
    },
    {
      "name": "Trent Alexander-Arnold",
      "playerId": "trent-alexander-arnold",
      "quantity": 250,
      "totalPrice": 83250
    },
    {
      "name": "Frenkie de Jong",
      "playerId": "frenkie-de-jong",
      "quantity": 300,
      "totalPrice": 63300
    },
    {
      "name": "Steven Bergwijn",
      "playerId": "steven-bergwijn",
      "quantity": 450,
      "totalPrice": 74700
    },
    {
      "name": "Virgil van Dijk",
      "playerId": "virgil-van-dijk",
      "quantity": 150,
      "totalPrice": 33100
    },
    {
      "name": "Rodri",
      "playerId": "rodrigo-hernandez",
      "quantity": 300,
      "totalPrice": 55800
    },
    {
      "name": "Alex Oxlade-Chamberlain",
      "playerId": "alex-oxlade-chamberlain",
      "quantity": 300,
      "totalPrice": 60900
    },
    {
      "name": "Joe Gomez",
      "playerId": "joe-gomez",
      "quantity": 100,
      "totalPrice": 17300
    },
    {
      "name": "Tanguy NDombele",
      "playerId": "tanguy-ndombele",
      "quantity": 510,
      "totalPrice": 73440
    },
    {
      "name": "Timo Werner",
      "playerId": "timo-werner",
      "quantity": 300,
      "totalPrice": 57300
    },
    {
      "name": "Mason Greenwood",
      "playerId": "mason-greenwood",
      "quantity": 900,
      "totalPrice": 412200
    },
    {
      "name": "Alphonso Davies",
      "playerId": "alphonso-davies",
      "quantity": 600,
      "totalPrice": 47400
    },
    {
      "name": "Dwight McNeil",
      "playerId": "dwight-mcneil",
      "quantity": 300,
      "totalPrice": 44400
    },
    {
      "name": "Thiago Almada",
      "playerId": "thiago-almada",
      "quantity": 600,
      "totalPrice": 141600
    },
    {
      "name": "David Brooks",
      "playerId": "david-brooks",
      "quantity": 750,
      "totalPrice": 134250
    },
    {
      "name": "Lionel Messi",
      "playerId": "lionel-messi",
      "quantity": 200,
      "totalPrice": 79800
    },
    {
      "name": "Jude Bellingham",
      "playerId": "jude-bellingham",
      "quantity": 450,
      "totalPrice": 157050
    },
    {
      "name": "Ansu Fati",
      "playerId": "ansu-fati",
      "quantity": 600,
      "totalPrice": 222600
    },
    {
      "name": "Reece James",
      "playerId": "reece-james",
      "quantity": 900,
      "totalPrice": 260100
    },
    {
      "name": "Adama",
      "playerId": "adama",
      "quantity": 1200,
      "totalPrice": 104400
    },
    {
      "name": "Billy Gilmour",
      "playerId": "billy-gilmour",
      "quantity": 200,
      "totalPrice": 29400
    },
    {
      "name": "Tahith Chong",
      "playerId": "tahith-chong",
      "quantity": 300,
      "totalPrice": 43200
    },
    {
      "name": "Yacine Adli",
      "playerId": "yacine-adli",
      "quantity": 100,
      "totalPrice": 15500
    },
    {
      "name": "Lee Kang-In",
      "playerId": "lee-kang-in",
      "quantity": 150,
      "totalPrice": 20100
    },
    {
      "name": "Justin Kluivert",
      "playerId": "justin-kluivert",
      "quantity": 100,
      "totalPrice": 13300
    },
    {
      "name": "Benjamin Mendy",
      "playerId": "benjamin-mendy",
      "quantity": 150,
      "totalPrice": 21300
    },
    {
      "name": "Willem Geubbels",
      "playerId": "willem-geubbels",
      "quantity": 100,
      "totalPrice": 10400
    },
    {
      "name": "Sam Lammers",
      "playerId": "sam-lammers",
      "quantity": 150,
      "totalPrice": 20100
    },
    {
      "name": "Willian",
      "playerId": "willian",
      "quantity": 100,
      "totalPrice": 12900
    }
  ]`);

const expiringShares: {
    name: string;
    quantity: number;
    totalPrice: number;
    buyTime: number;
}[] = [];

function randTime() {
    const twoAndAHalfYears = 365 * 2 * 24 * 60 * 60 * 1000;
    return Math.round(Date.now() - Math.random() * twoAndAHalfYears);
}

function getRandomInt(min: number, max: number) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}

for(const share of shares) {
    let alreadyDoneQuantity = 0;
    let alreadyDonePrice = 0;
    let x = Math.floor(share.quantity / 300) + Math.floor(Math.random() * 5) + 1;
    for(let i = 0; i < x; i++) {
        if(i === x - 1) { // last iteration
            let leftOverQuantity = share.quantity - alreadyDoneQuantity;
            do {
                const leftOverQuantity = share.quantity - alreadyDoneQuantity;
                const quantity = leftOverQuantity > 300 ? 300 : leftOverQuantity;
                const price = Math.floor(((share.totalPrice - alreadyDonePrice) / leftOverQuantity) * quantity);
                alreadyDonePrice += price;
                alreadyDoneQuantity += quantity;
                expiringShares.push({
                    name: share.name,
                    quantity: quantity,
                    totalPrice: price,
                    buyTime: randTime(),
                });
            } while(share.quantity - alreadyDoneQuantity > 0) {}
            break;
        }

        const quantity = Math.floor((share.quantity / x) * (getRandomInt(6, 10) / 10));
        const price = Math.floor((share.totalPrice / x) * (getRandomInt(3, 10) / 10));
        alreadyDonePrice += price;
        alreadyDoneQuantity += quantity;
        expiringShares.push({
            name: share.name,
            quantity,
            totalPrice: price,
            buyTime: randTime(),
        });
    }
}

console.log(JSON.stringify(expiringShares, null, 4));
