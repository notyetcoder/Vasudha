import type { User } from './types';

// These helper functions operate on an array of users, which you will
// fetch from your data source in your components/pages. This is efficient for small-to-medium datasets.

export const findUserById = (id: string | undefined, allUsers: User[]): User | undefined => {
    if (!id) return undefined;
    return allUsers.find(u => u.id === id);
}

export const findUserByName = (name: string | undefined, allUsers: User[]): User | undefined => {
    if (!name) return undefined;
    return allUsers.find(u => `${u.name}${u.surname}`.toLowerCase() === name.toLowerCase() && u.status === 'approved');
};

export const findChildren = (parent: User, allUsers: User[]): User[] => {
    if (!parent) return [];
    return allUsers.filter(u => 
        (u.fatherId === parent.id || u.motherId === parent.id)
    );
};

export const findSiblings = (user: User, allUsers: User[]): User[] => {
    if (!user || (!user.fatherId && !user.motherId)) return [];
    return allUsers.filter(u =>
        u.id !== user.id &&
        (
            (user.fatherId && u.fatherId === user.fatherId) || 
            (user.motherId && u.motherId === user.motherId)
        )
    );
};

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
