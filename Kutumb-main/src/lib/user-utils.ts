
import type { User } from './types';


const monthsOrder: { [key: string]: number } = {
    'JANUARY': 1, 'FEBRUARY': 2, 'MARCH': 3, 'APRIL': 4, 'MAY': 5, 'JUNE': 6,
    'JULY': 7, 'AUGUST': 8, 'SEPTEMBER': 9, 'OCTOBER': 10, 'NOVEMBER': 11, 'DECEMBER': 12
};

/**
 * Compares two users to see if person1 is older than person2.
 * Returns true if person1 is older, false if person2 is older, and null if ages are equal or cannot be determined.
 */
export const isPerson1Older = (person1?: User | null, person2?: User | null): boolean | null => {
    if (!person1 || !person2) return null;

    const year1 = person1.birthYear ? parseInt(person1.birthYear, 10) : null;
    const year2 = person2.birthYear ? parseInt(person2.birthYear, 10) : null;

    if (year1 && year2) {
        if (year1 < year2) return true;
        if (year1 > year2) return false;
        
        const month1 = person1.birthMonth ? monthsOrder[person1.birthMonth] : null;
        const month2 = person2.birthMonth ? monthsOrder[person2.birthMonth] : null;

        if (month1 && month2) {
            if (month1 < month2) return true;
            if (month1 > month2) return false;
        }
    }
    
    return null; 
};

export const sortUsersByAge = (a: User, b: User): number => {
    const isAUolder = isPerson1Older(a, b);
    if (isAUolder === true) return -1; // a is older, so it comes first
    if (isAUolder === false) return 1; // b is older, so it comes first
    return 0; // ages are equal or cannot be determined
};


export const findUserById = (id: string | undefined | null, allUsers: User[]): User | undefined => {
    if (!id) return undefined;
    return allUsers.find(u => u.id === id);
}

export const findUserByName = (name: string | undefined, allUsers: User[]): User | undefined => {
    if (!name) return undefined;
    return allUsers.find(u => `${u.name} ${u.surname}` === name);
}

export const findParents = (user: User, allUsers: User[]): { father?: User, mother?: User } => {
    if (!user) return {};
    const father = findUserById(user.fatherId, allUsers);
    const mother = findUserById(user.motherId, allUsers);
    return { father, mother };
}

export const findGrandparents = (user: User, allUsers: User[]): { paternalGrandfather?: User, paternalGrandmother?: User, maternalGrandfather?: User, maternalGrandmother?: User } => {
    if (!user) return {};
    const { father, mother } = findParents(user, allUsers);
    
    const paternalGrandfather = father ? findUserById(father.fatherId, allUsers) : undefined;
    const paternalGrandmother = father ? findUserById(father.motherId, allUsers) : undefined;
    
    const maternalGrandfather = mother ? findUserById(mother.fatherId, allUsers) : undefined;
    const maternalGrandmother = mother ? findUserById(mother.motherId, allUsers) : undefined;
    
    return { paternalGrandfather, paternalGrandmother, maternalGrandfather, maternalGrandmother };
}

    