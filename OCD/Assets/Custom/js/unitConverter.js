self.Converters = {

    convert: function (value, unitsIn, unitsOut) {
        var ratio = {};
        ratio.distanceRatio = {
            "mm": 1,
            "cm": 10,
            "dm": 100,
            "m": 1000,
            "dam": 10000,
            "hm": 100000,
            "km": 1000000,
            "in": 25.4,
            "ft": 304.8,
            "yd": 914.4,
            "mi": 1609344,
            "golden gate": 2737000
        };

        ratio.durationRatio = {
            "ms": 1,
            "s": 1000,
            "min": 60000,
            "h": 3600000,
            "j": 86400000,
            "hard egg": 600000
        };

        var unitOrder = [
            "distance",
            "duration"
        ];
        
        unitsIn = unitsIn.toLowerCase().split("/");
        unitsOut = unitsOut.toLowerCase().split("/");

        if (unitsIn.length != unitsOut.length) {
            console.error("Invalid units comparaison");
            return;
        }
        

        var unitUse = {}
        
        unitOrder.map(function (obj) {
            unitUse[obj] = false;
        });

        var unitAlt = false;

        for (let i = 0; i < unitsIn.length; i++) {
            for (let j in unitUse) {
                let item = unitUse[j];
                if (unitUse[j] === true)
                    continue;

                unitUse[j] = false;

                if (typeof ratio[j + "Ratio"][unitsIn[i]] == "undefined")
                    continue;
                if (unitAlt)
                    value = value / ratio[j + "Ratio"][unitsIn[i]];
                else
                    value = value * ratio[j + "Ratio"][unitsIn[i]];

                unitAlt = !unitAlt;
                break;

            }

        }

        unitUse = {};
        
        unitOrder.map(function (obj) {
            unitUse[obj] = false;
        });

        unitAlt = false;

        for (let i = 0; i < unitsOut.length; i++) {
            for (let j in unitUse) {
                if (!unitUse.hasOwnProperty(j))
                    continue;
                if (unitUse[j] === true)
                    continue;

                unitUse[j] = false;

                if (typeof ratio[j + "Ratio"][unitsOut[i]] == "undefined")
                    continue;

                if (unitAlt)
                    value = value * ratio[j + "Ratio"][unitsOut[i]];
                else
                    value = value / ratio[j + "Ratio"][unitsOut[i]];

                unitAlt = !unitAlt;
                break;
            }
        }

        return Math.round(value * 100000) / 100000;
    },

    convertAll: function (value, unitsIn, unitsOut) {
        var retObj = {}

        for (let i = 0; i < unitsOut.length; i++) {
            let item = unitsOut[i];

            retObj[item.replace("/", "_")] = self.Converters.convert(value, unitsIn, item);
        }

        return retObj;
    }
}