module ExamAssignmentMA {
    export class Images {
        // Specify all images here
        public static WhitePixel: string = 'white.png';
        public static MA_Logo: string = 'ma.png';
        // Tutorial
        public static TutorialBG: string = 'tutorialGraphic.jpg';
        // InGame
        public static Wagon: string = 'wagonPlaceholder.png';
        public static CargoCircle: string = 'cargoPlaceholderCirkel.png';
        public static CargoCube: string = 'cargoPlaceholderCube.png';
        public static CargoTriangle: string = 'cargoPlaceholderTriangle.png';
        public static CargoIndicatorCircle: string = 'cargoIndicatorPlaceholderCircle.png';
        public static CargoIndicatorCube: string = 'cargoIndicatorPlaceholderCube.png';
        public static CargoIndicatorTriangle: string = 'cargoIndicatorPlaceholderTriangle.png';
        public static TimeContainer: string = 'timebar.png';
        public static TimeFill: string = 'timebarFill.png';
        public static WagonCounter: string = 'wagonCounter.png';
        public static Background_01: string = 'backgroundTrees.png';
        public static Platform_01: string = 'trainstationPavement.png';
        // GameOver
        public static GameOverBG: string = 'endScreenBackground.jpg';
        public static RetryButton: string = 'retryButton.png';

        // Add all images here
        public static preloadList: string[] = [
            Images.WhitePixel,
            Images.MA_Logo,
            Images.Wagon,
            Images.CargoCircle,
            Images.CargoCube,
            Images.CargoTriangle,
            Images.CargoIndicatorCircle,
            Images.CargoIndicatorCube,
            Images.CargoIndicatorTriangle,
            Images.TimeContainer,
            Images.TimeFill,
            Images.WagonCounter,
            Images.Background_01,
            Images.Platform_01,
            Images.GameOverBG,
            Images.RetryButton,
            Images.TutorialBG
        ];
    }
}
