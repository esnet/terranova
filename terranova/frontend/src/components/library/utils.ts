// Shared function amongst all library pages
export const markFavorite = (
    userDataController: any,
    favorites: any,
    datatype: string,
    id: string,
) => {
    if (favorites?.[datatype]?.includes(id)) {
        const index = favorites?.[datatype]?.indexOf(id);
        favorites?.[datatype]?.splice(index, 1);
        userDataController.setProperty(`favorites`, favorites);
        userDataController.update();
    } else {
        favorites?.[datatype]?.push(id);
        userDataController.setProperty(`favorites`, favorites);
        userDataController.update();
    }
};
