import express from "express";
import {
    loginUser,
    getAllUsers,
    updateUser,
    deleteUser,
} from "../controllers/userController.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management and login
 */

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Login or register a user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: Vaibhav
 *               socketId:
 *                 type: string
 *                 example: "f3a123b4"
 *               roomCode:
 *                 type: string
 *                 example: "DIWALI99"
 *               isHost:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       200:
 *         description: Successfully logged in or registered user
 *       400:
 *         description: Missing or invalid name
 *       500:
 *         description: Server error
 */
router.post("/", loginUser);

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Returns list of all users
 *       500:
 *         description: Server error
 */
router.get("/", getAllUsers);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update user info (room or socket details)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: MongoDB user ID
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               socketId:
 *                 type: string
 *               roomCode:
 *                 type: string
 *               isHost:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Updated user data
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.put("/:id", updateUser);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Delete a user (cleanup on disconnect)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: MongoDB user ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       500:
 *         description: Server error
 */
router.delete("/:id", deleteUser);

export default router;
