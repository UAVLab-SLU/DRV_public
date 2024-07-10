export const flightPaths = [
    { value: 'fly_in_circle', label: 'Circle', id: 1 },
    { value: 'fly_to_points', label: 'Square', id: 1 },
    // {value:'fly_straight',label:'Straight', id:1}
]

export const droneTypes = [
    { value: 'FixedWing', label: 'Fixed Wing' },
    { value: 'MultiRotor', label: 'Multi Rotor' }
]

export const droneModels = {
    FixedWing: [
        { value: 'SenseflyeBeeX', label: 'Sensefly eBee X', src: '/images/SenseflyeBeeX.png' },
        { value: 'TrinityF90', label: 'Trinity F90', src: '/images/TrinityF90.png' }
    ],
    MultiRotor: [
        { value: 'ParrotANAFI', label: 'Parrot ANAFI', src: '/images/Parrot-ANAFI.png' },
        { value: 'DJI', label: 'DJI', src: '/images/DJI.png' },
        { value: 'VOXLm500', label: 'VOXL m500', src: '/images/VOXLm500.png' },
        { value: 'AureliaX6Pro', label: 'Aurelia X6 Pro', src: '/images/Aurelia-X6-Pro.png' },
        { value: 'IF1200', label: 'IF 1200', src: '/images/IF1200.png' },
        { value: 'Craziefly2.1', label: 'Craziefly 2.1', src: '/images/Craziefly2.1.png' },
        {/*value: 'StreamLineDesignX189', label: 'StreamLineDesign X189', src: null*/ }
    ]
}

export const locations = [
    { value: 'GeoLocation', id: 1 },
    { value: 'Cartesian Coordinate', id: 2 }
]