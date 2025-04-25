"use client"
import ChatForm from "@/components/chat-form";
import {useEffect, useRef, useState} from "react";
import ChatMessage from "@/components/ChatMessage";
import {socket} from "@/lib/socketClient";
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, Trophy, Beer, User, Dices  } from "lucide-react"
import {motion, number} from "framer-motion"

export default function Home() {
    const [messages, setMessages] = useState<{sender : string, message:string}[]>([]);
    const [room, setRoom] = useState("")
    const [joinded, setJoined] = useState(false)
    const [username, setUserName] = useState("")
    const [isRolling, setIsRolling] = useState(false)
    const [isTriman, setIsTriman] = useState(false)
    const [de1, setDe1] = useState<number>(0)
    const [de2, setDe2] = useState<number>(0)
    const [nbrTours, setNbrTours] = useState<number>(0)
    const [currentTurn, setCurrentTurn] = useState("")

    const [currentPlayer, setCurrentPlayer] = useState("")
    const [triman, setTriman] = useState<string>("null")

    const [gameMessage, setGameMessage] = useState("")

    const messagesEndRef = useRef<HTMLDivElement>(null)
    // Animation pour les dés quand on clique sur Jouer
    const handleRoll = () => {
        setIsRolling(true)
        const newDe1 = Math.floor(Math.random() * 6) + 1
        const newDe2 = Math.floor(Math.random() * 6) + 1

        setTimeout(() => {
            socket.emit("dice-roll", { room, username, de1: newDe1, de2: newDe2, total: newDe1 + newDe2 })
            setDe1(newDe1)
            setDe2(newDe2)
            setIsRolling(false)
            setNbrTours(nbrTours+1)
            // Utiliser le nextPlayer reçu du serveur
            setCurrentTurn("En attente du prochain joueur...")



            generateGameMessage(newDe1, newDe2, username,triman)

        }, 1000)

    }
    // Générer un message basé sur le résultat des dés
    const generateGameMessage = (d1: number, d2: number, user:string, triman:string) => {
        const total = d1 + d2
        if (triman !== null) {
            if (d1 === d2) {
                setGameMessage(`Double ${d1}! ${user} distribue ${total} gorgées!`)
            } else if (total === 3) {
                setGameMessage(`${user} est triman et boit 1 gorgée pour fêter ça !`)
            } else if (total === 7) {
                setGameMessage(`${user} boit 1 gorgée et ton voisin de gauche boit 1 gorgée`)
            } else if (total === 11) {
                setGameMessage(`Tout le monde boit 1 gorgée!`)
            } else if (total === 2) {
                setGameMessage(`${user} boit 2 gorgées!`)
            } else if (total === 12) {
                setGameMessage(`${user} distribue 6 gorgées!`)
            } else {
                setGameMessage(`${user} a fait ${total}. Rien ne se passe.`)
                setTriman("null")
            }
        } else {
            setGameMessage(`${user} a fait ${total}. On cheche un triman.`)
            if (total === 3 || d1 === 3 || d1 === 3) {
                setTriman(user)
            }

        }
    }

    // Fonction pour obtenir l'icône de dé correspondant à la valeur
    const getDiceIcon = (value: number) => {
        const icons = [
            <Dice1 key={1} className="w-16 h-16" />,
            <Dice2 key={2} className="w-16 h-16" />,
            <Dice3 key={3} className="w-16 h-16" />,
            <Dice4 key={4} className="w-16 h-16" />,
            <Dice5 key={5} className="w-16 h-16" />,
            <Dice6 key={6} className="w-16 h-16" />,
        ]
        return icons[value - 1] || icons[0]
    }
    const handleSendMessage = (message:string) => {
        console.log(message)
    }

    const handleJoinRoom = () => {
        if (room && username) {
            socket.emit("join-room", {room, username: username})
            setJoined(true)
            setCurrentPlayer(username)

        }
    }

    useEffect(() => {
        socket.on("message", (data) => {

            setMessages((prev) => [...prev,data])
        })


        socket.on("user_joined", (message) => {

            setMessages((prev) => [...prev, {sender: "system", message}])
        })

        socket.on("dice-roll-result", (data) => {
            if (data.username !== username) {
                setDe1(data.de1)
                setDe2(data.de2)
                setCurrentPlayer(data.username)
                // Utiliser le nextPlayer reçu du serveur

                if (data.nextPlayer) {

                    // Si le prochain joueur est l'utilisateur actuel, c'est son tour
                    if (data.nextPlayer === username) {
                        console.log(`C'est à votre tour !`)

                        setCurrentTurn(`C'est à votre tour !`)
                    } else {
                        console.log(`C'est au tour de ${data.nextPlayer}.`)

                        setCurrentTurn(`C'est au tour de ${data.nextPlayer}.`)
                    }
                }
                generateGameMessage(data.de1, data.de2, data.username, triman)
            }
        })

        socket.on("player_list", (players) => {
            console.log("Liste des joueurs:", players)

        })



        return () => {
            socket.off("user_joined")
            socket.off("message")
            socket.off("dice-roll-result")
            socket.off("player8list")

        }
    },[username])
  return (
      <div className="flex justify-center max-h-screen w-screen">
          {!joinded ? (
              <div
                  className="flex w-full max-w-md mx-auto flex-col items-center justify-center h-screen bg-neutral-900 p-6">
                  <motion.div
                      className="w-full bg-gradient-to-br from-purple-600 to-indigo-700 rounded-3xl p-8 shadow-lg"
                      initial={{opacity: 0, y: 20}}
                      animate={{opacity: 1, y: 0}}
                      transition={{duration: 0.5}}
                  >
                      <h1 className="mb-6 text-3xl font-bold text-center text-white">Jeu de Dés</h1>
                      <div className="space-y-4">
                          <div>
                              <label className="block text-sm font-medium text-white mb-1">Votre pseudo</label>
                              <input
                                  type="text"
                                  className="w-full px-4 py-3 bg-white/10 border border-white/20 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50"
                                  placeholder="Entrez votre pseudo..."
                                  onChange={(e) => setUserName(e.target.value)}
                              />
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-white mb-1">Code de la salle</label>
                              <input
                                  type="text"
                                  className="w-full px-4 py-3 bg-white/10 border border-white/20 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50"
                                  placeholder="Entrez le code de la salle..."
                                  onChange={(e) => setRoom(e.target.value)}
                              />
                          </div>
                          <button
                              className="w-full px-4 py-3 mt-4 text-white bg-gradient-to-r from-emerald-500 to-green-600 rounded-lg hover:from-emerald-600 hover:to-green-700 transition-all font-medium"
                              onClick={handleJoinRoom}
                          >
                              Rejoindre la salle
                          </button>
                      </div>
                  </motion.div>
              </div>
          ) : (
              <div className="w-full max-w-screen mx-auto">
                  <div className="h-screen w-screen mx-auto overflow-y-auto mb-4 bg-neutral-900 ">

                      <div className="grid grid-cols-2 grid-rows-5 gap-4  h-full">
                          {/* Section du joueur actuel */}
                          <motion.div
                              className="col-span-2 p-4 pb-0"
                              initial={{opacity: 0, y: -20}}
                              animate={{opacity: 1, y: 0}}
                              transition={{duration: 0.5}}
                          >
                              <div
                                  className="w-full h-full flex justify-between flex-col bg-gradient-to-br from-amber-400 to-amber-500 rounded-3xl p-6 pb-3 shadow-lg">
                                  <div className="flex items-center gap-3">
                                      {triman ? (
                                              <>
                                                <Beer className="w-6 h-6 text-red-600"/>
                                                <p className="text-md font-bold text-red-600">sss</p>
                                              </>
                                          ) : (
                                            <>
                                                <Beer className="w-6 h-6 text-white"/>
                                                <p className="text-md font-bold text-white">On cherche un triman</p>
                                            </>
                                          )
                                      }
                                  </div>
                                  <div className="h-full flex items-center justify-center py-1">
                                      <p className="text-md font-extrabold text-white drop-shadow-md ">{gameMessage}</p>
                                  </div>
                                  <div className="w-full   flex justify-between">
                                      <div className="bg-white/30 flex  px-4 py-1 rounded-full">

                                          <User className="w-6 h-6 text-white "/>
                                          <p className="text-sm font-bold text-white"> {currentTurn}</p>
                                      </div>
                                      <div className="bg-white/30 px-4 py-1 rounded-full">
                                          <p className="text-sm font-bold text-white">Tour {nbrTours}</p>
                                      </div>
                                  </div>
                              </div>
                          </motion.div>
                          {/* Dé 1 */}
                          <motion.div
                              className="row-span-2 row-start-2 p-3 pr-2"
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.5, delay: 0.2 }}
                          >
                              <div className="w-full flex flex-col items-center justify-between h-full bg-gradient-to-br from-purple-600 to-indigo-700 rounded-3xl p-5 shadow-lg">
                                  <p className="text-xl font-bold text-white/90 mb-2">Dé 1</p>
                                  <motion.div
                                      className="w-32 h-32 bg-white rounded-2xl flex items-center justify-center shadow-inner"
                                      animate={{
                                          rotate: isRolling ? [0, 360, 720, 1080] : 0,
                                          scale: isRolling ? [1, 0.8, 1.1, 1] : 1,
                                      }}
                                      transition={{ duration: 1, ease: "easeInOut" }}
                                  >
                                      {getDiceIcon(de1)}
                                  </motion.div>
                                  <div className="mt-4 bg-white/20 px-6 py-3 rounded-full">
                                      <p className="text-3xl font-bold text-white">{de1}</p>
                                  </div>
                              </div>
                          </motion.div>
                          {/* Dé 2 */}
                          <motion.div
                              className="row-span-2 row-start-2 p-3 pr-2"
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.5, delay: 0.2 }}
                          >
                              <div className="w-full flex flex-col items-center justify-between h-full bg-gradient-to-br from-purple-600 to-indigo-700 rounded-3xl p-5 shadow-lg">
                                  <p className="text-xl font-bold text-white/90 mb-2">Dé 2</p>
                                  <motion.div
                                      className="w-32 h-32 bg-white rounded-2xl flex items-center justify-center shadow-inner"
                                      animate={{
                                          rotate: isRolling ? [0, 360, 720, 1080] : 0,
                                          scale: isRolling ? [1, 0.8, 1.1, 1] : 1,
                                      }}
                                      transition={{ duration: 1, ease: "easeInOut" }}
                                  >
                                      {getDiceIcon(de2)}
                                  </motion.div>
                                  <div className="mt-4 bg-white/20 px-6 py-3 rounded-full">
                                      <p className="text-3xl font-bold text-white">{de2}</p>
                                  </div>
                              </div>
                          </motion.div>
                          <div className=" col-span-2 row-start-4 p-4 mb-1 pt-0">
                              <div className="w-full max-h-full h-full flex flex-col bg-red-500 rounded-3xl p-4">
                                  <p className="text-lg font-bold text-white">Total : </p>
                                  <div className="h-full flex justify-center items-center">
                                      <p className="text-6xl font-bold text-white">{de2 + de1} </p>
                                  </div>
                              </div>
                          </div>

                          {/* Bouton Jouer */}
                          <motion.div
                              className="col-span-2 row-start-5 p-4 mb-3 pt-2"
                              initial={{ opacity: 0, y: 30 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.5, delay: 0.5 }}
                          >
                              {currentPlayer ? (
                                  <motion.button
                                      className="w-full h-full bg-gradient-to-br from-emerald-500 to-green-600 rounded-3xl p-3 shadow-lg flex items-center justify-center gap-4 hover:from-emerald-600 hover:to-green-700 transition-all"
                                      whileTap={{scale: 0.95}}
                                      onClick={handleRoll}
                                  >

                                      <p className="text-4xl font-bold text-white">Lancer les dés</p>
                                      <Dices className="w-8 h-8 text-white"/>
                                  </motion.button>
                              ): (
                                  <motion.button
                                      className="w-full h-full bg-gradient-to-br from-red-500 to-red-600 rounded-3xl p-3 shadow-lg flex items-center justify-center gap-4 hover:from-red-600 hover:to-red-700 transition-all"

                                  >

                                      <p className="text-4xl font-bold text-white">Lancer les dés</p>
                                      <Dices className="w-8 h-8 text-white"/>
                                  </motion.button>
                              )}
                          </motion.div>
                      </div>

                  </div>
              </div>
          )}
      </div>
  );
}
