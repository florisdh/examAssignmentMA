﻿module ExamAssignmentMA {
    /**
     * The state that combines all game logics and assets.
     */
    export class GamePlay extends Phaser.State {

        public static Name: string = 'gameplay';
        private session: SessionData;
        private environment: Environment;
        private timeIndicator: TimeIndicator;
        private train: Train;
        private cargo: CargoPlatform;
        private scoreIndicator: ScoreIndicator;
        private wagonIndicator: WagonIndicator;
        private tutorial: IngameTutorial;
        private screenFade: ScreenFade;
        private completedWagons: number;
        private correct: Phaser.Sound;
        private incorrect: Phaser.Sound;
        private trainRiding: Phaser.Sound;
        private trainWhistle: Phaser.Sound;
        private backgroundMusic: Phaser.Sound;
        private intermissionScreen: Intermission;

        /**
         * Adds all game assets and sets up all game elements.
         * @param session The data containing the current sessions score.
         */
        public init(session?: SessionData): void {
            if (session) {
                this.session = session;
            } else {
                this.session = new SessionData(0, 0, 0, 0, 0, 0, 0, 0);
            }

            this.environment = new Environment(this.game);

            this.train = new Train(this.game);
            this.train.wagonCompleted.add(this.moveToNext, this);

            this.cargo = new CargoPlatform(this.game);
            this.cargo.cargoAdded.add(this.cargoGridAdded, this);
            this.cargo.cargoRemoved.add(this.cargoGridRemoved, this);

            this.timeIndicator = new TimeIndicator(this.game);
            this.timeIndicator.timeOut.addOnce(this.onTimeOut, this);

            this.scoreIndicator = new ScoreIndicator(this.game);
            this.wagonIndicator = new WagonIndicator(this.game);

            this.scoreIndicator.setScore(this.session.currentMoney);
            this.session.moneyChanged.add((money: number) => {
                this.scoreIndicator.setScore(money);
            });

            this.correct = this.game.add.sound(Sounds.CorrectCargo, 1, false);
            this.incorrect = this.game.add.sound(Sounds.IncorrectCargo, 1, false);
            this.trainRiding = this.game.add.sound(Sounds.TrainRiding, 1, false);
            this.trainWhistle = this.game.add.sound(Sounds.TrainWhistle2, 1, false);
            this.backgroundMusic = this.game.add.sound(Sounds.BackgroundMusic, 0.1, true);
            this.backgroundMusic.play();

            this.tutorial = new IngameTutorial(this.game);

            this.screenFade = new ScreenFade(this.game);

            this.intermissionScreen = new Intermission(this.game);
            this.intermissionScreen.intermissionDone.add(this.onRoundDone, this);

            this.game.add.existing(this.timeIndicator);
            this.game.add.existing(this.cargo);
            this.game.add.existing(this.scoreIndicator);
            this.game.add.existing(this.wagonIndicator);
            this.game.add.existing(this.tutorial);
            this.game.add.existing(this.screenFade);

            this.resize();
            this.screenFade.fadeOut(this.startRound, this);
        }

        private startRound(): void {
            this.train.reset(this.session.calcTrainLength());
            this.cargo.reset();
            this.moveToNext();
            this.completedWagons = 0;
            this.wagonIndicator.setWagonAmount(this.train.amountOfCargoWagons);
        }

        private stop(): void {
            this.train.wagonCompleted.remove(this.moveToNext, this);
            this.cargo.cargoAdded.remove(this.cargoGridAdded, this);
            this.cargo.cargoRemoved.remove(this.cargoGridRemoved, this);
            this.timeIndicator.timeOut.remove(this.onTimeOut, this);
        }

        private showIntermission(): void {
            this.intermissionScreen.openIntermission(this.session);
        }

        private onRoundDone(): void {
            this.session.nextRound();
            this.startRound();
        }

        private moveToNext(): void {
            let wagon: Wagon = this.train.moveToNext();

            if (wagon) {
                if (wagon.type === WagonTypes.CargoWagon) {
                    let requiredCargo: CargoTypes[] = (<CargoWagon>wagon).setRandomCargo(this.session.calcCargoAmount());
                    this.cargo.createNext().spawnCargo(requiredCargo);
                    // On MoveIn done
                    wagon.moveInDone.addOnce(() => {
                        this.timeIndicator.start(this.session.calcWagonTime(requiredCargo.length));
                    });
                    // On Wagon objective done
                    wagon.objectiveDone.addOnce(() => {
                        this.timeIndicator.stop();
                        this.session.nextWagon(this.timeIndicator.remainingTime, this.timeIndicator.totalTime);
                        this.completedWagons++;
                        this.wagonIndicator.setWagonAmount(this.train.amountOfCargoWagons - this.completedWagons);
                    });
                } else if (wagon.type === WagonTypes.Caboose) {
                    this.timeIndicator.stop();
                    wagon.moveOutDone.addOnce(this.showIntermission, this);
                    this.trainRiding.play(null, null, 1);
                    this.trainRiding.fadeOut(4000);
                    this.trainWhistle.play(null, null, 1);
                    this.trainWhistle.fadeOut(4000);
                }

                if (wagon.type !== WagonTypes.Locomotive) {
                    this.cargo.moveToNext();
                }
            }
            if (this.train.currentWagonIndex !== this.train.amountOfCargoWagons + 2) {
                this.environment.moveToNext(this.train.currentWagonIndex === this.train.amountOfCargoWagons + 2);
            }
            this.tutorial.setActiveWagon(wagon);
        }

        private cargoGridAdded(cargo: CargoGrid): void {
            cargo.cargoDropped.add(this.onCargoDropped, this);
            cargo.cargoUpdate.add(this.onCargoDragUpdate, this);
            this.tutorial.setActiveGrid(cargo);
        }

        private cargoGridRemoved(cargo: CargoGrid): void {
            cargo.cargoDropped.remove(this.onCargoDropped, this);
            cargo.cargoUpdate.remove(this.onCargoDragUpdate, this);
        }

        /**
         * Handles the drop of the cargo, validated the drop point and tries to put it in the wagon.
         * @param cargo The cargo being dropped.
         */
        private onCargoDropped(cargo: Cargo): void {
            if (this.train.activeWagon.type === WagonTypes.CargoWagon) {
                let activeWagon: CargoWagon = <CargoWagon>this.train.activeWagon;
                if (this.train.isOnDropPoint(<Phaser.Point>cargo.worldPosition)) {
                    if (activeWagon.dropCargo(cargo)) {
                        // Correct
                        cargo.fadeOut(activeWagon);
                        this.correct.play();
                        this.session.addMoney(50); // TODO: create particles for money
                        if (activeWagon.nextCargoType === CargoTypes.None) {
                            this.timeIndicator.stop();
                        }
                        this.tutorial.resetIdleCheck();
                        this.session.droppedCargo(true);
                    } else {
                        // Incorrect
                        this.shakeScreen();
                        cargo.moveBack();
                        this.timeIndicator.damageTime(1000);
                        this.incorrect.play();
                        this.session.droppedCargo(false);
                    }
                } else {
                    cargo.moveBack();
                }
                if (activeWagon.glowEnabled) {
                    activeWagon.disableGlow();
                }
            } else {
                cargo.moveBack();
            }
        }

        private onCargoDragUpdate(cargo: Cargo): void {
            if (this.train.activeWagon.type === WagonTypes.CargoWagon) {
                let wagon: CargoWagon = <CargoWagon>this.train.activeWagon;

                if (wagon.glowEnabled !== this.train.isOnDropPoint(<Phaser.Point>cargo.worldPosition)) {
                    if (wagon.glowEnabled) {
                        wagon.disableGlow();
                    } else {
                        wagon.enableGlow(cargo.type);
                    }
                }
                this.tutorial.resetIdleCheck();
            }
        }

        private shakeScreen(): void {
            this.game.camera.shake(0.05, 50, true, Phaser.Camera.SHAKE_HORIZONTAL);
        }

        private onTimeOut(): void {
            this.stop();
            this.backgroundMusic.stop();
            this.screenFade.fadeIn(() => {
                this.game.state.start(GameOver.Name, true, false, this.session);
            });
        }

        /**
         * Resizes all game elements based on the screen size.
         */
        public resize(): void {
            this.environment.resize();
            this.train.y = this.environment.platformY;
            this.train.resize();
            this.cargo.resize();
            let topUiY: number = this.game.height * 0.05;
            this.timeIndicator.resize(topUiY);
            this.scoreIndicator.resize(topUiY);
            this.wagonIndicator.resize(topUiY);
            this.tutorial.resize();
            this.screenFade.resize();
            this.intermissionScreen.resize();
        }
    }
}
