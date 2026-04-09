from app.schemas import VehiclePrediction

MOCK_RESULTS: list[VehiclePrediction] = [
    VehiclePrediction(
        vehicle_type="car",
        make="Ford",
        model="Mustang GT",
        year_range="2018–2023",
        country_of_origin="United States",
        confidence=0.91,
        reason="Distinctive fastback roofline, tri-bar LED taillights, and running-pony badge clearly visible.",
        fun_facts=[
            "The Mustang was the first 'pony car' and launched an entire segment of sporty American vehicles.",
            "Over 10 million Mustangs have been sold since its debut at the 1964 New York World's Fair.",
            "The GT500 variant of this generation produces 760 hp — one of the most powerful production Mustangs ever.",
            "The Mustang is the world's best-selling sports car, outselling the Corvette by a wide margin.",
            "A Mustang has appeared in over 4,000 TV shows and films.",
        ],
        specs={
            "Engine": "5.0L Ti-VCT V8",
            "Horsepower": "450 hp",
            "Torque": "410 lb-ft",
            "0–60 mph": "4.3 seconds",
            "Top speed": "163 mph",
            "Transmission": "6-speed manual or 10-speed automatic",
        },
        brief_history=(
            "The Ford Mustang GT is the iconic V8-powered variant of America's best-selling sports car. "
            "First introduced in 1964, the sixth-generation (2018–2023) brought independent rear suspension "
            "for the first time, along with a turbocharged 2.3L EcoBoost four-cylinder as a base option. "
            "The GT retained its beloved 5.0L Coyote V8, producing 450 hp and cementing its reputation "
            "as a driver's car that balances raw performance with everyday usability."
        ),
    ),
    VehiclePrediction(
        vehicle_type="car",
        make="Chevrolet",
        model="Camaro SS",
        year_range="2016–2023",
        country_of_origin="United States",
        confidence=0.61,
        reason="Similar muscle-car proportions and wide rear haunches, but badge and grille details favor Mustang.",
        fun_facts=[
            "The Camaro was created specifically to compete with the Ford Mustang.",
        ],
        specs={
            "Engine": "6.2L V8",
            "Horsepower": "455 hp",
        },
        brief_history="The sixth-generation Chevrolet Camaro SS is Ford's closest rival in the pony-car segment.",
    ),
]
