import DbService from '../services/db.service';

// Get a token by ID
const getById = async (id) => {
    return DbService.queryOne('select * from cloud.tokens where id = $1;', [id]);
};

// Create a new token
const create = async ({ id }) => {
    return DbService.queryOne('insert into cloud.tokens (id) values ($1) returning *;', [id]);
};

// Delete a single token by ID
const deleteById = async (id) => {
    await DbService.query('delete from cloud.tokens where id = $1;', [id]);
};

export default {
    create,
    getById,
    deleteById,
};
